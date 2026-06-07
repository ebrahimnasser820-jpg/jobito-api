import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportedContent } from '../entities/reported-content.entity.js';
import { AdminAuthService } from './admin-auth.service.js';
import { MailService } from '../../mail/mail.service.js';
import { User } from '../../users/user.entity.js';
import { Job } from '../../jobs/job.entity.js';
import { Company } from '../../companies/company.entity.js';

@Injectable()
export class AdminContentManagementService {
  constructor(
    @InjectRepository(ReportedContent)
    private reportedContentRepo: Repository<ReportedContent>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    private adminAuthService: AdminAuthService,
    private mailService: MailService,
  ) {}

  async getReportedContent(status = 'pending', page = 1, limit = 20) {
    const [reports, total] = await this.reportedContentRepo.findAndCount({
      where: { status },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: reports.map((r) => ({
        reportId: r.reportId,
        postOwner: r.postOwnerName,
        postOwnerId: r.postOwnerId,
        content: r.contentText || r.customReason || 'Reported Profile/Item',
        contentType: r.contentType,
        contentId: r.contentId,
        reason: r.reason,
        customReason: r.customReason,
        status: r.status,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reviewContent(
    adminId: string,
    reportId: number,
    action: 'delete' | 'dismiss',
    notifyViolation?: boolean,
  ) {
    const report = await this.reportedContentRepo.findOne({
      where: { reportId },
    });
    if (!report) throw new NotFoundException('Report not found');
    report.status = action === 'delete' ? 'deleted' : 'dismissed';
    report.reviewedBy = adminId;
    await this.reportedContentRepo.save(report);
    await this.adminAuthService.logActivity(
      adminId,
      action === 'delete' ? 'DELETE_CONTENT' : 'DISMISS_REPORT',
      'Content',
      String(reportId),
      `${action === 'delete' ? 'Deleted' : 'Dismissed'} reported content from ${report.postOwnerName}`,
    );

    if (
      action === 'delete' &&
      report.contentType === 'job' &&
      report.contentId
    ) {
      try {
        await this.jobRepo.query(
          'DELETE FROM ptj.applications WHERE job_id = $1',
          [report.contentId],
        );
        await this.jobRepo.delete(report.contentId);
      } catch (err) {
        console.error('Error deleting job or applications:', err);
      }
    }

    if (notifyViolation && report.postOwnerId) {
      try {
        let emailAddress: string | null = null;
        let ownerName = report.postOwnerName;

        if (/^\d+$/.test(report.postOwnerId)) {
          const company = await this.companyRepo.findOne({
            where: { companyId: Number(report.postOwnerId) },
          });
          if (company && company.contactEmail) {
            emailAddress = company.contactEmail;
            ownerName = company.name;
          }
        } else {
          const user = await this.userRepo.findOne({
            where: { userId: report.postOwnerId },
          });
          if (user && user.email) {
            emailAddress = user.email;
            ownerName = user.fullName || ownerName;
          }
        }

        if (emailAddress) {
          const emailBody =
            action === 'delete'
              ? 'تم حذف وظيفتك لانتهاكها معايير الموقع. نرجو الالتزام بالقوانين لتجنب إيقاف حسابك.'
              : 'هذا إنذار بخصوص مخالفة معايير الموقع. يرجى الالتزام لتجنب إيقاف حسابك.';

          await this.mailService.sendModerationEmail(
            emailAddress,
            ownerName,
            emailBody,
            'WARNING',
          );
        }
      } catch (err) {
        console.error('Error sending violation email:', err);
      }
    }

    return {
      message: `Report has been ${action === 'delete' ? 'deleted' : 'dismissed'}.`,
    };
  }

  async submitReport(data: Partial<ReportedContent>) {
    const report = this.reportedContentRepo.create(data);
    return this.reportedContentRepo.save(report);
  }
}
