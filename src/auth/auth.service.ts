import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices' ;
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { UsersService } from '../users/users.service.js';
import { CompaniesService } from '../companies/companies.service.js';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service.js';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service.js';
import { MongoUserProfileService } from '../users/mongo-user-profile.service.js';
import { OtpCode } from './otp-code.entity.js';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { Admin } from '../admin/entities/admin.entity.js';
import { AdminDashboardService } from '../admin/services/admin-dashboard.service.js';
import { AuditLog } from '../audit-logs/audit-log.entity.js';
import { AdminActivityLog } from '../admin/entities/admin-activity-log.entity.js';
import * as admin from 'firebase-admin';
import { Vonage } from '@vonage/server-sdk';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private companiesService: CompaniesService,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectRepository(OtpCode)
    private otpRepo: Repository<OtpCode>,
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(AdminActivityLog)
    private adminActivityLogRepo: Repository<AdminActivityLog>,
    private notificationsService: NotificationsService, // Changed from ClientProxy to Service
    private mongoUserProfileService: MongoUserProfileService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
    const secretHash = Buffer.from(secret).toString('base64').substring(0, 10);
    console.log(`🔑 Signing Secret Check: Length=${secret.length}, HashPrefix=${secretHash}`);
  }

  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  /** Generate a random 6-digit code */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /** Save OTP code to DB + cleanup old expired codes */
  private async saveOtp(userId: string, code: string): Promise<OtpCode> {
    // Invalidate previous unused codes for this user
    await this.otpRepo.update(
      { userId: userId, isUsed: false },
      { isUsed: true },
    );

    // Cleanup expired codes older than 1 hour (issue #10)
    await this.otpRepo.delete({
      expiresAt: LessThan(new Date(Date.now() - 60 * 60 * 1000)),
    });

    const otp = this.otpRepo.create({
      userId: userId,
      code,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Increased to 30 minutes
    });
    return this.otpRepo.save(otp);
  }

  /** Validate OTP code with detailed logging */
  private async validateOtp(userId: string, code: string): Promise<OtpCode> {
    const cleanCode = code.trim();
    this.logger.info(`🔍 [AuthService] Validating OTP code: [${cleanCode}] for user: ${userId}`);

    const otp = await this.otpRepo.findOne({
      where: {
        userId: userId,
        code: cleanCode,
      },
      order: { expiresAt: 'DESC' }
    });

    if (!otp) {
      // Find ANY recent OTP for this user to log more details
      const anyOtp = await this.otpRepo.findOne({ where: { userId }, order: { expiresAt: 'DESC' } });
      this.logger.warn(`❌ [AuthService] OTP code [${cleanCode}] not found for user ${userId}. Latest code in DB for this user was: [${anyOtp?.code}]`);
      throw new BadRequestException('Invalid verification code.');
    }

    if (otp.isUsed) {
      this.logger.warn(`❌ [AuthService] OTP code ${cleanCode} has already been used.`);
      throw new BadRequestException('This code has already been used.');
    }

    const now = new Date();
    // Buffer of 5 minutes to handle server time drifts
    const adjustedExpiresAt = new Date(otp.expiresAt.getTime() + 5 * 60 * 1000); 

    if (now > adjustedExpiresAt) {
      this.logger.warn(`❌ [AuthService] OTP code ${cleanCode} expired. Now: ${now}, ExpiresAt: ${otp.expiresAt} (Adjusted: ${adjustedExpiresAt})`);
      throw new BadRequestException('This code has expired. Please request a new one.');
    }

    // Mark as used
    otp.isUsed = true;
    await this.otpRepo.save(otp);
    this.logger.info(`✅ [AuthService] OTP code ${cleanCode} validated successfully.`);
    return otp;
  }


  // ─── Registration ─────────────────────────────────────────────

  async register(data: any) {
    if (AdminDashboardService.maintenanceMode) {
      throw new BadRequestException('The system is currently undergoing maintenance. Registration is temporarily disabled. Please try again later.');
    }

    const cleanEmail = data.email?.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(cleanEmail);
    if (existing) {
      if (existing.isActive) {
        throw new BadRequestException('Email already registered');
      }
      // If user exists but is not active, we allow re-registration (it will update the existing user)
      this.logger.info(`Updating pending registration for: ${cleanEmail}`);
    }

    const hash = await bcrypt.hash(data.password, 10);
    const role = data.role || 'user';
    
    if (role !== 'user' && role !== 'company' && role !== 'student') {
      throw new BadRequestException('Invalid role. Must be user, company, or student.');
    }

    let user;
    if (existing) {
      // Update existing inactive user
      user = await this.usersService.update(existing.userId, {
        fullName: data.fullName || data.full_name || data.name || data.email.split('@')[0],
        passwordHash: hash,
        role: role,
        phone: data.phone || data.companyPhone,
        registrationData: JSON.stringify(data), // Stage data for post-verification profile creation
        isActive: false, 
      });
    } else {
      // Create new inactive user
      user = await this.usersService.create({
        fullName: data.fullName || data.full_name || data.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        passwordHash: hash,
        role: role,
        phone: data.phone || data.companyPhone,
        registrationData: JSON.stringify(data), // Stage data
        isActive: false,
      });
    }

    const code = this.generateCode();
    await this.saveOtp(user.userId, code);

    this.logger.info(`Starting registration for: ${data.email} with role: ${role}. Data staged in user bio.`);
    
    this.notificationsService.handleUserRegistered({ email: cleanEmail, code }).catch(err => {
      this.logger.error(`[AuthService] Background mail trigger failed: ${err.message}`);
    });

    // Log new registration as a System event
    try {
      await this.adminActivityLogRepo.save(this.adminActivityLogRepo.create({
        actionType: 'USER_REGISTERED',
        targetEntity: 'System',
        targetId: user.userId,
        description: `New ${role} registered: ${cleanEmail}`,
        metadata: { email: cleanEmail, role },
      }));
    } catch (logErr) {
      this.logger.warn(`Failed to log registration: ${logErr.message}`);
    }
    
    return { message: 'Registration pending. Please check your email for the verification code to complete your setup.' };
  }

  // ─── Email Verification ───────────────────────────────────────

  async verifyEmailLink(email: string, code: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.isActive) return !!user?.isActive;

    try {
      await this.validateOtp(user.userId, code);
      await this.usersService.update(user.userId, { isActive: true });
      return true;
    } catch (err) {
      return false;
    }
  }

  async verifyEmail(email: string, code: string) {
    const cleanEmail = email?.trim().toLowerCase();
    const user = await this.usersService.findByEmail(cleanEmail);
    if (user) {
      if (user.isActive) {
        return { message: 'Email already verified' };
      }

      try {
        // 1. Validate OTP first
        await this.validateOtp(user.userId, code);

        // 2. SUCCESS! Now final profile creation happens
        if (user.role === 'company' && user.registrationData) {
          try {
            const registrationData = JSON.parse(user.registrationData);
            await this.companiesService.create({
              name: registrationData.name || registrationData.companyName || user.fullName,
              contactEmail: user.email,
              phone: user.phone || undefined,
              address: registrationData.address || registrationData.companyAddress,
              crDocumentUrl: registrationData.cr_document_url || registrationData.commercial_register,
              taxId: registrationData.tax_number || registrationData.taxNumber,
              taxDocumentUrl: registrationData.tax_document_url,
              licenseNumber: registrationData.license_number || registrationData.licenseNumber,
              officialNationalId: registrationData.national_id || registrationData.nationalId,
            });
            this.logger.info(`✅ Company profile created successfully for ${email}`);
          } catch (profileErr) {
            this.logger.warn(`Could not finalize company profile for ${email}: ${profileErr.message}`);
          }
        }

        // 3. Activate and Clear staged data
        await this.usersService.update(user.userId, { 
          isActive: true,
          registrationData: "" // Clear staging
        });

        // 4. Initialize Profile for individual users (if not company)
        if (user.role === 'user' || user.role === 'student') {
          try {
            const registrationData = user.registrationData ? JSON.parse(user.registrationData) : {};
            await this.usersService.update(user.userId, {
              classification: registrationData.classification || null,
              location: registrationData.location || '',
              bio: '', // Initial empty bio
              skills: [],
            });
            this.logger.info(`✅ Initial individual profile prepared for ${email}`);
          } catch (profileErr) {
            this.logger.warn(`Could not initialize individual profile for ${email}: ${profileErr.message}`);
          }
        }

        // 5. Create MongoDB profile for newly verified user
        this.mongoUserProfileService.ensureUserProfile({
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl || null,
          role: user.role,
          isActive: true,
        }).catch(err => this.logger.warn(`⚠️ MongoDB profile sync failed on verify: ${err.message}`));

        // Log user verification to AdminActivityLog (the table Operations Monitor reads from)
        try {
          await this.adminActivityLogRepo.save(this.adminActivityLogRepo.create({
            actionType: 'USER_VERIFIED',
            targetEntity: 'User',
            targetId: user.userId,
            description: `New user verified and activated: ${user.fullName} (${user.role})`,
            metadata: { email: user.email, role: user.role }
          }));
        } catch (logErr) {
          this.logger.warn(`Failed to log user verification to AdminActivityLog: ${logErr.message}`);
        }

        return { message: 'Email verified and profile activated successfully!' };
      } catch (err) {
        throw new BadRequestException(err.message || 'Invalid or expired code.');
      }
    }

    throw new NotFoundException('Pending verification record not found.');
  }

  // ─── Resend Code ──────────────────────────────────────────────

  async resendCode(email: string) {
    const cleanEmail = email?.trim().toLowerCase();
    const user = await this.usersService.findByEmail(cleanEmail);
    
    if (user) {
      if (user.isActive) return { message: 'Email already verified' };
      
      const code = this.generateCode();
      await this.saveOtp(user.userId, code);
      this.notificationsService.handleUserRegistered({ email, code }).catch(err => {
        this.logger.error(`[AuthService] Background resend mail trigger failed: ${err.message}`);
      });

      return { message: 'Verification code sent to your email' };
    }

    throw new NotFoundException('User not found. Please register.');
  }


  // ─── Firebase Phone Auth ───────────────────────────────────────
  async verifyFirebasePhoneToken(email: string, firebaseToken: string) {
    const cleanEmail = email?.trim().toLowerCase();
    const user = await this.usersService.findByEmail(cleanEmail);
    
    if (!user) throw new NotFoundException('User not found.');
    if (user.isActive) return { message: 'Account is already verified.' };

    try {
      // 1. Verify token using Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      
      const phone = decodedToken.phone_number;
      if (!phone) {
        throw new BadRequestException('The provided token does not contain a verified phone number.');
      }

      // 2. Update user's phone number
      if (user.phone !== phone) {
        await this.usersService.update(user.userId, { phone });
      }

      // 3. Perform the exact same activation logic as verifyEmail
      if (user.role === 'company' && user.registrationData) {
        try {
          const registrationData = JSON.parse(user.registrationData);
          await this.companiesService.create({
            name: registrationData.name || registrationData.companyName || user.fullName,
            contactEmail: user.email,
            phone: phone,
            address: registrationData.address || registrationData.companyAddress,
            crDocumentUrl: registrationData.cr_document_url || registrationData.commercial_register,
            taxId: registrationData.tax_number || registrationData.taxNumber,
            taxDocumentUrl: registrationData.tax_document_url,
            licenseNumber: registrationData.license_number || registrationData.licenseNumber,
            officialNationalId: registrationData.national_id || registrationData.nationalId,
          });
          this.logger.info(`✅ Company profile created successfully for ${email}`);
        } catch (profileErr: any) {
          this.logger.warn(`Could not finalize company profile for ${email}: ${profileErr.message}`);
        }
      }

      // Activate and Clear staged data
      await this.usersService.update(user.userId, { 
        isActive: true,
        registrationData: "",
        isPhoneVerified: true
      });

      // Initialize Profile for individual users
      if (user.role === 'user' || user.role === 'student') {
        try {
          const registrationData = user.registrationData ? JSON.parse(user.registrationData) : {};
          await this.usersService.update(user.userId, {
            classification: registrationData.classification || null,
            location: registrationData.location || '',
            bio: '', 
            skills: [],
          });
        } catch (profileErr: any) {
          this.logger.warn(`Could not initialize profile for ${email}: ${profileErr.message}`);
        }
      }

      // Create MongoDB profile
      this.mongoUserProfileService.ensureUserProfile({
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl || null,
        role: user.role,
        isActive: true,
      }).catch(err => this.logger.warn(`⚠️ MongoDB profile sync failed: ${err.message}`));

      return { message: 'Phone verified and profile activated successfully via Firebase!' };
    } catch (error: any) {
      this.logger.error(`Firebase Phone Verification failed: ${error.message}`);
      throw new BadRequestException('Invalid or expired Firebase token.');
    }
  }

  // ─── Login ────────────────────────────────────────────────────

  async login(data: any) {
    // 1. Try finding in Admins table (Unified login)
    const admin = await this.adminRepo.findOne({ where: { email: data.email } });
    if (admin) {
      const isPasswordValid = await bcrypt.compare(data.password, admin.passwordHash);
      if (!isPasswordValid) {
        await this.auditLogRepo.save(this.auditLogRepo.create({
          action: 'FAILED_LOGIN',
          entity: 'ADMIN',
          entityId: admin.adminId,
          metadata: { email: data.email }
        }));
        // Also log failed admin login to AdminActivityLog for Operations Monitor
        try {
          await this.adminActivityLogRepo.save(this.adminActivityLogRepo.create({
            actionType: 'FAILED_LOGIN',
            targetEntity: 'System',
            targetId: admin.adminId,
            description: `Failed admin login attempt for ${data.email}`,
            metadata: { email: data.email, reason: 'invalid_password' },
          }));
        } catch (logErr) {
          this.logger.warn(`Failed to log failed admin login: ${logErr.message}`);
        }
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!admin.isActive) {
        throw new UnauthorizedException('Admin account is deactivated');
      }

      const payload = {
        sub: admin.adminId,
        adminId: admin.adminId,
        email: admin.email,
        role: 'admin',
        adminRole: admin.role,
        name: admin.fullName,
        avatar: admin.avatarUrl,
      };

      // Log admin login activity to AdminActivityLog (the table Operations Monitor reads from)
      try {
        await this.adminActivityLogRepo.save(this.adminActivityLogRepo.create({
          adminId: admin.adminId,
          actionType: 'LOGIN',
          targetEntity: 'Admin',
          targetId: admin.adminId,
          description: `${admin.fullName} logged in successfully`,
          metadata: { email: admin.email, role: admin.role },
        }));
      } catch (logErr) {
        this.logger.warn(`Failed to log admin login to AdminActivityLog: ${logErr.message}`);
      }

      return { access_token: this.jwtService.sign(payload) };
    }

    // 2. Try finding in Users table
    const cleanEmail = data.email?.trim().toLowerCase();
    let user = await this.usersService.findByEmail(cleanEmail);

    if (user) {
      if (AdminDashboardService.maintenanceMode) {
        throw new UnauthorizedException('The system is currently undergoing maintenance. Login is temporarily disabled. Please try again later.');
      }

      if (!user.passwordHash) {
        throw new UnauthorizedException('This account uses Google login. Please sign in with Google.');
      }

      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isPasswordValid) {
        await this.auditLogRepo.save(this.auditLogRepo.create({
          action: 'FAILED_LOGIN',
          entity: 'USER',
          entityId: user.userId,
          metadata: { email: data.email }
        }));
        // Also log failed user login to AdminActivityLog for Operations Monitor
        try {
          await this.adminActivityLogRepo.save(this.adminActivityLogRepo.create({
            actionType: 'FAILED_LOGIN',
            targetEntity: 'System',
            targetId: user.userId,
            description: `Failed login attempt for user ${data.email}`,
            metadata: { email: data.email, reason: 'invalid_password' },
          }));
        } catch (logErr) {
          this.logger.warn(`Failed to log failed user login: ${logErr.message}`);
        }
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive && user.accountStatus === 'active') {
        throw new UnauthorizedException('Please verify your email before logging in');
      }

      if (user.accountStatus === 'banned') {
        throw new UnauthorizedException('This account has been permanently banned.');
      }

      if (user.accountStatus === 'suspended') {
        if (user.suspendedUntil && user.suspendedUntil > new Date()) {
          const daysLeft = Math.ceil((user.suspendedUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          throw new UnauthorizedException(`Your account is restricted. You can log in again in ${daysLeft} days.`);
        } else if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
          // Restriction expired
          user.accountStatus = 'active';
          user.isActive = true;
          user.suspendedUntil = null;
          await this.usersService.update(user.userId, { accountStatus: 'active', isActive: true, suspendedUntil: null });
        }
      }

      // Block company users whose registration is not yet approved
      if (user.role === 'company') {
        const company = await this.companiesService.findByContactEmailOrName(user.email);
        if (company) {
          if (company.verificationStatus === 'PENDING') {
            throw new UnauthorizedException('Your company registration is pending admin approval. Please wait for the admin to review your request.');
          }
          if (company.verificationStatus === 'REJECTED') {
            throw new UnauthorizedException(`Your company registration was rejected. Reason: ${company.rejectionReason || 'Registration requirements not met'}. Please contact support for more information.`);
          }
        }
      }

      // Block tradesmen whose criminal record is pending or rejected
      if (user.classification === 'tradesman') {
        if (user.accountStatus === 'pending') {
          throw new UnauthorizedException('حسابك قيد المراجعة حالياً بانتظار موافقة المسؤول على الفيش الجنائي. الرجاء المحاولة لاحقاً بعد تفعيل الحساب.');
        }
        if (user.accountStatus === 'cr_rejected') {
          throw new UnauthorizedException('تم رفض الفيش الجنائي الخاص بك من قِبل الإدارة. يرجى التواصل مع الدعم الفني لمزيد من التفاصيل.');
        }
      }

      // ─── Ensure MongoDB profile exists ───────────────────────
      this.mongoUserProfileService.ensureUserProfile({
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl || null,
        bannerUrl: user.banner_url || null,
        role: user.role,
        phone: user.phone || null,
        location: user.location || null,
        classification: user.classification || null,
        isActive: user.isActive,
      }).catch(err => this.logger.warn(`⚠️ MongoDB profile sync failed on login: ${err.message}`));

      // Log user login activity to AdminActivityLog (the table Operations Monitor reads from)
      try {
        await this.adminActivityLogRepo.save(this.adminActivityLogRepo.create({
          actionType: 'USER_LOGIN',
          targetEntity: 'User',
          targetId: user.userId,
          description: `User ${user.fullName} (${user.role}) logged in successfully`,
          metadata: { email: user.email, role: user.role },
        }));
      } catch (logErr) {
        this.logger.warn(`Failed to log user login to AdminActivityLog: ${logErr.message}`);
      }

      const payload: any = {
        sub: user.userId,
        email: user.email,
        role: user.role,
        name: user.fullName,
        avatar: user.avatarUrl,
        banner: user.banner_url,
        phone: user.phone || null,
        gender: user.applicantProfile?.gender || null,
        location: user.location || null,
        classification: user.classification || null,
        notificationPreferences: user.notificationPreferences || null,
        services: user.services || [],
        criminalRecordUrl: user.criminalRecordUrl || null,
        accountStatus: user.accountStatus,
      };

      // If user is admin in the main table, add admin claims so they can pass Admin guards
      if (user.role === 'admin') {
        payload.adminId = user.userId;
        payload.adminRole = 'super_admin'; // Default to super_admin for legacy main-table admins
      }

      return { access_token: this.jwtService.sign(payload) };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  // ─── Forgot Password ─────────────────────────────────────────

  async forgotPassword(email: string) {
    const cleanEmail = email?.trim().toLowerCase();
    const user = await this.usersService.findByEmail(cleanEmail);
    if (!user) throw new NotFoundException('User not found');

    const code = this.generateCode();
    await this.saveOtp(user.userId, code);
    await this.mailService.sendPasswordResetCode(email, code);

    return { message: 'Password reset code sent to your email' };
  }

  // ─── Reset Password ──────────────────────────────────────────

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    await this.validateOtp(user.userId, code);

    const hash = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user.userId, { passwordHash: hash });

    // Log password reset as a System event
    try {
      await this.adminActivityLogRepo.save(this.adminActivityLogRepo.create({
        actionType: 'PASSWORD_RESET',
        targetEntity: 'System',
        targetId: user.userId,
        description: `Password reset completed for ${email}`,
        metadata: { email, method: 'email_otp' },
      }));
    } catch (logErr) {
      this.logger.warn(`Failed to log password reset: ${logErr.message}`);
    }

    return {
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }

  // ─── Google Login ─────────────────────────────────────────────

  async validateGoogleUser(token: string) {
    if (AdminDashboardService.maintenanceMode) {
      throw new UnauthorizedException('The system is currently undergoing maintenance. Login is temporarily disabled. Please try again later.');
    }

    try {
      let email: string | undefined;
      let name: string | undefined;
      let picture: string | undefined;
      let googleId: string | undefined;

      // Detect token type: JWT id_tokens have 3 dot-separated segments
      const isIdToken = token.split('.').length === 3;

      if (isIdToken) {
        // Standard id_token from GoogleLogin component
        const ticket = await this.googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) throw new BadRequestException('Invalid Google token payload');
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        googleId = payload.sub;
      } else {
        // Access token from useGoogleLogin hook — fetch user info from Google
        const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        if (!res.ok) throw new BadRequestException('Failed to fetch Google user info');
        const info = await res.json();
        email = info.email;
        name = info.name;
        picture = info.picture;
        googleId = info.sub;
      }

      if (!email) throw new BadRequestException('Email not provided by Google');

      let user = await this.usersService.findByEmail(email);

      if (!user) {
        const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
        const hash = await bcrypt.hash(randomPassword, 10);

        user = await this.usersService.create({
          fullName: name || email.split('@')[0],
          email: email,
          passwordHash: hash,
          googleId: googleId,
          avatarUrl: picture,
          role: 'user',
          isActive: true,
        });
      } else {
        // Auto-Link if email exists but googleId is missing
        if (!user.googleId) {
          user = await this.usersService.update(user.userId, { googleId: googleId });
          this.logger.info(`Auto-linked Google account for existing user: ${email}`);
        } else if (user.googleId !== googleId) {
          throw new UnauthorizedException('Security mismatch: Google ID does not match. Please contact support.');
        }
      }

      if (!user) throw new UnauthorizedException('User could not be found or created');

      if (user.accountStatus === 'banned') {
        throw new UnauthorizedException('This account has been permanently banned.');
      }

      if (user.accountStatus === 'suspended') {
        if (user.suspendedUntil && user.suspendedUntil > new Date()) {
          const daysLeft = Math.ceil((user.suspendedUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          throw new UnauthorizedException(`Your account is restricted. You can log in again in ${daysLeft} days.`);
        } else if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
          user.accountStatus = 'active';
          user.isActive = true;
          user.suspendedUntil = null;
          await this.usersService.update(user.userId, { accountStatus: 'active', isActive: true, suspendedUntil: null });
        }
      }

      // Block tradesmen whose criminal record is pending or rejected
      if (user.classification === 'tradesman') {
        if (user.accountStatus === 'pending') {
          throw new UnauthorizedException('حسابك قيد المراجعة حالياً بانتظار موافقة المسؤول على الفيش الجنائي. الرجاء المحاولة لاحقاً بعد تفعيل الحساب.');
        }
        if (user.accountStatus === 'cr_rejected') {
          throw new UnauthorizedException('تم رفض الفيش الجنائي الخاص بك من قِبل الإدارة. يرجى التواصل مع الدعم الفني لمزيد من التفاصيل.');
        }
      }

      // ─── Ensure MongoDB profile exists ───────────────────────
      this.mongoUserProfileService.ensureUserProfile({
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl || null,
        bannerUrl: user.banner_url || null,
        role: user.role,
        phone: user.phone || null,
        location: user.location || null,
        classification: user.classification || null,
        isActive: user.isActive,
      }).catch(err => this.logger.warn(`⚠️ MongoDB profile sync failed on Google login: ${err.message}`));

      const jwtPayload = {
        sub: user.userId,
        email: user.email,
        role: user.role,
        name: user.fullName,
        avatar: user.avatarUrl,
        banner: user.banner_url,
        phone: user.phone || null,
        gender: user.applicantProfile?.gender || null,
        location: user.location || null,
        classification: user.classification || null,
        notificationPreferences: user.notificationPreferences || null,
        deletionRequestedAt: user.deletionRequestedAt || null,
        services: user.services || [],
        criminalRecordUrl: user.criminalRecordUrl || null,
        accountStatus: user.accountStatus,
      };

      // Log Google login as a System event
      try {
        await this.adminActivityLogRepo.save(this.adminActivityLogRepo.create({
          actionType: 'GOOGLE_LOGIN',
          targetEntity: 'System',
          targetId: user.userId,
          description: `Google login: ${user.fullName} (${user.email})`,
          metadata: { email: user.email, role: user.role, method: 'google' },
        }));
      } catch (logErr) {
        this.logger.warn(`Failed to log Google login: ${logErr.message}`);
      }

      return {
        access_token: this.jwtService.sign(jwtPayload),
        user: {
          id: user.userId,
          name: user.fullName,
          email: user.email,
          role: user.role,
          avatar: user.avatarUrl,
          phone: user.phone || null,
          notificationPreferences: user.notificationPreferences || null,
        },
      };
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      throw new UnauthorizedException(`Failed to verify Google token: ${error.message || 'Unknown error'}`);
    }
  }

  // ─── Reset Password with Google ────────────────────────────────
  async resetPasswordWithGoogle(googleToken: string, newPassword: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) throw new BadRequestException('Invalid Google token payload');

      const { email } = payload;
      if (!email) throw new BadRequestException('Email not provided by Google');

      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('No Jobito account found associated with this Google email.');
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await this.usersService.update(user.userId, { passwordHash: hash });

      return {
        message: 'Password reset successfully via Google verification. You can now log in.',
      };
    } catch (error: any) {
      this.logger.error(`Google Password Reset Error: ${error.message}`);
      throw new UnauthorizedException(`Failed to verify Google identity: ${error.message || 'Unknown error'}`);
    }
  }


  async refreshUserToken(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      this.logger.error(`❌ [AuthService] refreshUserToken: User with ID ${userId} not found in database.`);
      throw new NotFoundException('User not found');
    }

    const jwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      name: user.fullName,
      avatar: user.avatarUrl,
      banner: user.banner_url,
      phone: user.phone || null,

      gender: user.applicantProfile?.gender || null,
      location: user.location || null,
      classification: user.classification || null,
      notificationPreferences: user.notificationPreferences || null,
      deletionRequestedAt: user.deletionRequestedAt || null,
      services: user.services || [],
      criminalRecordUrl: user.criminalRecordUrl || null,
      accountStatus: user.accountStatus,
    };

    return {
      access_token: this.jwtService.sign(jwtPayload),
    };
  }

  // ─── Link Google Account ─────────────────────────────────────────

  async linkGoogleAccount(userId: string, token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) throw new BadRequestException('Invalid Google token payload');
 
      const { email, sub: googleId, name, picture } = payload;
      
      const user = await this.usersService.findById(userId);
      if (!user) throw new NotFoundException('User not found');
 
      // Check if this Google ID is already linked to ANOTHER user
      const existingWithGoogle = await this.usersService.findByGoogleId(googleId);
      if (existingWithGoogle && existingWithGoogle.userId !== userId) {
        throw new BadRequestException('This Google account is already linked to another Jobito account');
      }
 
      // Update with googleId and optionally name/avatar if not set
      const updatePayload: any = { googleId };
      if (!user.fullName) updatePayload.fullName = name;
      if (!user.avatarUrl) updatePayload.avatarUrl = picture;
 
      await this.usersService.update(userId, updatePayload);
      this.logger.info(`Linked Google account ${email} to user ${userId}`);

      return { message: 'Google account linked successfully' };
    } catch (error: any) {
      throw new BadRequestException(`Failed to link Google account: ${error.message}`);
    }
  }
}
