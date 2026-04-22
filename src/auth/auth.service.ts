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
import { OtpCode } from './otp-code.entity.js';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private companiesService: CompaniesService,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectRepository(OtpCode)
    private otpRepo: Repository<OtpCode>,
    private notificationsService: NotificationsService, // Changed from ClientProxy to Service
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
    this.logger.info(`🔍 [AuthService] Validating OTP code: ${code} for user: ${userId}`);

    // Fetch the code without restrictive filters first to find the root cause
    const otp = await this.otpRepo.findOne({
      where: {
        userId: userId,
        code,
      },
      order: { expiresAt: 'DESC' } // Take the most recent one if multiple exist
    });

    if (!otp) {
      this.logger.warn(`❌ [AuthService] OTP code ${code} not found for user ${userId}`);
      throw new BadRequestException('Invalid verification code.');
    }

    if (otp.isUsed) {
      this.logger.warn(`❌ [AuthService] OTP code ${code} has already been used.`);
      throw new BadRequestException('This code has already been used.');
    }

    if (new Date() > otp.expiresAt) {
      this.logger.warn(`❌ [AuthService] OTP code ${code} expired at ${otp.expiresAt}. Current time: ${new Date()}`);
      throw new BadRequestException('This code has expired. Please request a new one.');
    }

    // Mark as used
    otp.isUsed = true;
    await this.otpRepo.save(otp);
    this.logger.info(`✅ [AuthService] OTP code ${code} validated successfully.`);
    return otp;
  }

  // ─── Registration ─────────────────────────────────────────────

  async register(data: any) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      if (existing.isActive) {
        throw new BadRequestException('Email already registered');
      }
      // If user exists but is not active, we allow re-registration (it will update the existing user)
      this.logger.info(`Updating pending registration for: ${data.email}`);
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
        fullName: data.fullName || data.full_name || data.name || data.email.split('@')[0],
        email: data.email,
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
    
    await this.notificationsService.handleUserRegistered({ email: data.email, code });
    
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
    const user = await this.usersService.findByEmail(email);
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
              licenseNumber: registrationData.license_number || registrationData.licenseNumber || registrationData.commercial_register,
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
              classification: registrationData.classification || 'job_seeker',
              location: registrationData.location || '',
              bio: '', // Initial empty bio
              skills: [],
            });
            this.logger.info(`✅ Initial individual profile prepared for ${email}`);
          } catch (profileErr) {
            this.logger.warn(`Could not initialize individual profile for ${email}: ${profileErr.message}`);
          }
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
    const user = await this.usersService.findByEmail(email);
    
    if (user) {
      if (user.isActive) return { message: 'Email already verified' };
      
      const code = this.generateCode();
      await this.saveOtp(user.userId, code);
      await this.notificationsService.handleUserRegistered({ email, code });

      return { message: 'Verification code sent to your email' };
    }

    throw new NotFoundException('User not found. Please register.');
  }

  // ─── Login ────────────────────────────────────────────────────

  async login(data: any) {
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('This account uses Google login. Please sign in with Google.');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const payload = {
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
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // ─── Forgot Password ─────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
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

    return {
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }

  // ─── Google Login ─────────────────────────────────────────────

  async validateGoogleUser(token: string) {
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
      };

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
