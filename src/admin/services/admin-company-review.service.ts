import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../companies/company.entity.js';
import { User } from '../../users/user.entity.js';
import { AdminAuthService } from './admin-auth.service.js';
import { MailService } from '../../mail/mail.service.js';

@Injectable()
export class AdminCompanyReviewService {
  constructor(
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private adminAuthService: AdminAuthService,
    private mailService: MailService,
  ) {}

  /**
   * Get pending company registration requests
   */
  async getPendingCompanies() {
    const companies = await this.companyRepo.find({
      where: { verificationStatus: 'PENDING' },
      order: { createdAt: 'DESC' },
    });

    return {
      data: companies.map((c) => ({
        companyId: c.companyId,
        companyName: c.name,
        registrationDate: c.createdAt,
        status: c.verificationStatus,
        contactEmail: c.contactEmail,
        phone: c.phone,
        crDocumentUrl: c.crDocumentUrl,
        taxDocumentUrl: c.taxDocumentUrl,
        taxId: c.taxId,
        licenseNumber: c.licenseNumber,
        officialNationalId: c.officialNationalId,
        address: c.address,
        logoUrl: c.logoUrl,
      })),
      pendingCount: companies.length,
    };
  }

  /**
   * Get company details for review
   */
  async getCompanyDetails(companyId: number) {
    const company = await this.companyRepo.findOne({
      where: { companyId },
      relations: ['jobs'],
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  /**
   * Approve or reject a company registration
   */
  async reviewCompany(adminId: string, companyId: number | string, action: 'approve' | 'reject', rejectionReason?: string) {
    const idNum = Number(companyId);
    const company = await this.companyRepo.findOne({ where: { companyId: idNum as any } });
    if (!company) throw new NotFoundException('Company not found');

    if (company.verificationStatus !== 'PENDING') {
      throw new BadRequestException(`Company has already been ${company.verificationStatus.toLowerCase()}`);
    }

    if (action === 'approve') {
      company.verificationStatus = 'APPROVED';
      company.rejectionReason = '';
    } else {
      company.verificationStatus = 'REJECTED';
      company.rejectionReason = rejectionReason || 'Registration requirements not met';
    }

    await this.companyRepo.save(company);

    // Update the associated user account's active status
    if (company.contactEmail) {
      const normalizedEmail = company.contactEmail.trim().toLowerCase();
      const user = await this.userRepo.createQueryBuilder('user')
        .where('LOWER(user.email) = :email', { email: normalizedEmail })
        .andWhere('user.role = :role', { role: 'company' })
        .getOne();
      if (user) {
        if (action === 'reject') {
          // Deactivate user so they cannot log in
          user.isActive = false;
          user.accountStatus = 'rejected';
          await this.userRepo.save(user);
        } else if (action === 'approve') {
          // Ensure user is active and account status is reset if previously rejected
          user.isActive = true;
          user.accountStatus = 'active';
          await this.userRepo.save(user);
        }
      }
    }

    await this.adminAuthService.logActivity(
      adminId,
      action === 'approve' ? 'APPROVE_COMPANY' : 'REJECT_COMPANY',
      'Company',
      String(companyId),
      `${action === 'approve' ? 'Approved' : 'Rejected'} company: ${company.name}${rejectionReason ? ' - Reason: ' + rejectionReason : ''}`,
    );

    if (company.contactEmail) {
      await this.mailService.sendReviewResultEmail(
        company.contactEmail,
        company.name,
        'Company',
        action,
        rejectionReason
      ).catch(e => console.error('Failed to send company review email:', e));
    }

    return {
      message: `Company "${company.name}" has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
      verificationStatus: company.verificationStatus,
    };
  }

  /**
   * Get all companies (with filter)
   */
  async listAllCompanies(status?: string) {
    const where: any = {};
    if (status) {
      where.verificationStatus = status.toUpperCase();
    }

    const companies = await this.companyRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return {
      data: companies.map((c) => ({
        companyId: c.companyId,
        companyName: c.name,
        registrationDate: c.createdAt,
        status: c.verificationStatus,
        contactEmail: c.contactEmail,
        industry: c.industry,
      })),
      total: companies.length,
    };
  }

  /**
   * Get tradesmen (students) who have uploaded a criminal record document for review
   */
  async getTradesmenWithCriminalRecords(status?: string) {
    const qb = this.userRepo.createQueryBuilder('user')
      .select([
        'user.userId',
        'user.fullName',
        'user.email',
        'user.phone',
        'user.criminalRecordUrl',
        'user.avatarUrl',
        'user.accountStatus',
        'user.classification',
        'user.createdAt',
      ])
      .where('user.role = :role', { role: 'student' })
      .andWhere('user.criminalRecordUrl IS NOT NULL')
      .andWhere("user.criminalRecordUrl != ''")
      .orderBy('user.createdAt', 'DESC');

    if (status === 'pending') {
      // Users who uploaded but haven't been explicitly verified
      qb.andWhere("(user.accountStatus = 'active' OR user.accountStatus IS NULL)");
    } else if (status === 'verified') {
      qb.andWhere("user.accountStatus = 'verified'");
    } else if (status === 'rejected') {
      qb.andWhere("user.accountStatus = 'cr_rejected'");
    }

    const users = await qb.getMany();

    return {
      data: users.map(u => ({
        userId: u.userId,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        criminalRecordUrl: u.criminalRecordUrl,
        avatarUrl: u.avatarUrl,
        status: u.accountStatus === 'verified' ? 'VERIFIED' : u.accountStatus === 'cr_rejected' ? 'REJECTED' : 'PENDING',
        classification: u.classification,
        registrationDate: u.createdAt,
      })),
      total: users.length,
    };
  }

  /**
   * Review a tradesman's criminal record
   */
  async reviewCriminalRecord(adminId: string, userId: string, action: 'approve' | 'reject', reason?: string) {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('User not found');

    if (action === 'approve') {
      user.accountStatus = 'verified';
    } else {
      user.accountStatus = 'cr_rejected';
    }

    await this.userRepo.save(user);

    await this.adminAuthService.logActivity(
      adminId,
      action === 'approve' ? 'APPROVE_CRIMINAL_RECORD' : 'REJECT_CRIMINAL_RECORD',
      'User',
      userId,
      `${action === 'approve' ? 'Approved' : 'Rejected'} criminal record for ${user.fullName}${reason ? ' - Reason: ' + reason : ''}`,
    );

    if (user.email) {
      await this.mailService.sendReviewResultEmail(
        user.email,
        user.fullName,
        'Criminal Record',
        action,
        reason
      ).catch(e => console.error('Failed to send criminal record review email:', e));
    }

    return {
      message: `Criminal record for "${user.fullName}" has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
      newStatus: user.accountStatus,
    };
  }
}

