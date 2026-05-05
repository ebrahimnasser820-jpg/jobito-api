import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Admin, AdminRole } from '../entities/admin.entity.js';
import { AdminActivityLog } from '../entities/admin-activity-log.entity.js';
import { MailService } from '../../mail/mail.service.js';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
    @InjectRepository(AdminActivityLog)
    private activityLogRepo: Repository<AdminActivityLog>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // ─── Setup: Create First Super Admin ─────────────────────────
  async setupFirstAdmin(fullName: string, email: string, password: string) {
    const existingAdmins = await this.adminRepo.count();
    if (existingAdmins > 0) {
      throw new BadRequestException('System already has admins. Use invitation to add more.');
    }

    const hash = await bcrypt.hash(password, 12);
    const admin = this.adminRepo.create({
      fullName,
      email,
      passwordHash: hash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    });

    const saved = await this.adminRepo.save(admin);

    await this.logActivity(saved.adminId, 'SYSTEM_SETUP', 'System', null, 'First super admin account created');

    return { message: 'Super Admin account created successfully.', adminId: saved.adminId };
  }

  // ─── Login ───────────────────────────────────────────────────
  async login(email: string, password: string) {
    const admin = await this.adminRepo.findOne({ where: { email } });

    if (!admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await this.adminRepo.save(admin);

    const payload = {
      sub: admin.adminId,
      adminId: admin.adminId,
      email: admin.email,
      role: 'admin',
      adminRole: admin.role,
      name: admin.fullName,
    };

    await this.logActivity(admin.adminId, 'LOGIN', 'Admin', admin.adminId, `${admin.fullName} logged in`);

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        adminId: admin.adminId,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        avatarUrl: admin.avatarUrl,
      },
    };
  }

  // ─── Invite New Admin (Super Admin only) ─────────────────────
  async inviteAdmin(inviterId: string, fullName: string, email: string, role: AdminRole, password?: string) {
    const inviter = await this.adminRepo.findOne({ where: { adminId: inviterId } });
    if (!inviter || inviter.role !== AdminRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only Super Admins can invite new admins');
    }

    const existing = await this.adminRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An admin with this email already exists');
    }

    // Use provided password or generate temporary one
    const finalPassword = password || this.generateTempPassword();
    const hash = await bcrypt.hash(finalPassword, 12);

    const newAdmin = this.adminRepo.create({
      fullName,
      email,
      passwordHash: hash,
      role,
      isActive: true,
      invitedBy: inviterId,
    });

    const saved = await this.adminRepo.save(newAdmin);

    // Send invitation email with temp password
    try {
      await this.mailService.sendMail(
        email,
        'Jobito Admin Panel Invitation',
        `Hello ${fullName},\n\nYou have been invited to the Jobito Admin Panel as ${role === AdminRole.SUPER_ADMIN ? 'System Administrator' : 'Operations Manager'}.\n\nYour temporary credentials:\nEmail: ${email}\nPassword: ${finalPassword}\n\nPlease change your password after first login.\n\nBest regards,\nJobito Team`,
      );
    } catch (err) {
      console.error('Failed to send admin invitation email:', err.message);
    }

    await this.logActivity(
      inviterId,
      'INVITE_ADMIN',
      'Admin',
      saved.adminId,
      `${inviter.fullName} invited ${fullName} as ${role}`,
    );

    return {
      message: `Admin invitation sent to ${email}`,
      adminId: saved.adminId,
      tempPassword: password ? '********' : finalPassword, 
    };
  }

  // ─── Get Admin Profile ───────────────────────────────────────
  async getProfile(adminId: string) {
    const admin = await this.adminRepo.findOne({ where: { adminId } });
    if (!admin) throw new NotFoundException('Admin not found');

    const { passwordHash, ...profile } = admin;
    return profile;
  }

  // ─── Change Password ────────────────────────────────────────
  async changePassword(adminId: string, oldPassword: string, newPassword: string) {
    const admin = await this.adminRepo.findOne({ where: { adminId } });
    if (!admin) throw new NotFoundException('Admin not found');

    const isValid = await bcrypt.compare(oldPassword, admin.passwordHash);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.adminRepo.save(admin);

    await this.logActivity(adminId, 'CHANGE_PASSWORD', 'Admin', adminId, 'Password changed');

    return { message: 'Password changed successfully' };
  }

  // ─── List All Admins (Super Admin only) ──────────────────────
  async listAdmins() {
    const admins = await this.adminRepo.find({
      order: { createdAt: 'ASC' },
      select: ['adminId', 'fullName', 'email', 'role', 'isActive', 'lastLoginAt', 'createdAt'],
    });
    return admins;
  }

  // ─── Activity Log helpers ────────────────────────────────────
  async logActivity(
    adminId: string,
    actionType: string,
    targetEntity: string,
    targetId: string | null,
    description: string,
    metadata?: any,
  ) {
    const log = this.activityLogRepo.create({
      adminId,
      actionType,
      targetEntity,
      targetId,
      description,
      metadata,
    });
    return this.activityLogRepo.save(log);
  }

  async getActivityLogs(page = 1, limit = 20) {
    const [logs, total] = await this.activityLogRepo.findAndCount({
      relations: ['admin'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs.map((log) => ({
        user: log.admin?.fullName || 'System',
        actionType: log.actionType,
        description: log.description,
        dateTime: log.createdAt,
        targetEntity: log.targetEntity,
        targetId: log.targetId,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }
}
