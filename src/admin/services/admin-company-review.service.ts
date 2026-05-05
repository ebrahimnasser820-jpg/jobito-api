import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../companies/company.entity.js';
import { AdminAuthService } from './admin-auth.service.js';

@Injectable()
export class AdminCompanyReviewService {
  constructor(
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    private adminAuthService: AdminAuthService,
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
  async reviewCompany(adminId: string, companyId: number, action: 'approve' | 'reject', rejectionReason?: string) {
    const company = await this.companyRepo.findOne({ where: { companyId } });
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

    await this.adminAuthService.logActivity(
      adminId,
      action === 'approve' ? 'APPROVE_COMPANY' : 'REJECT_COMPANY',
      'Company',
      String(companyId),
      `${action === 'approve' ? 'Approved' : 'Rejected'} company: ${company.name}${rejectionReason ? ' - Reason: ' + rejectionReason : ''}`,
    );

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
}
