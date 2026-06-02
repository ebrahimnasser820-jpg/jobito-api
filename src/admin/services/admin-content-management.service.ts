import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportedContent } from '../entities/reported-content.entity.js';
import { AdminAuthService } from './admin-auth.service.js';
import { MailService } from '../../mail/mail.service.js';
import { User } from '../../users/user.entity.js';

@Injectable()
export class AdminContentManagementService {
  constructor(
    @InjectRepository(ReportedContent)
    private reportedContentRepo: Repository<ReportedContent>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
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
        reportId: r.reportId, postOwner: r.postOwnerName, postOwnerId: r.postOwnerId,
        content: r.contentText || r.customReason || "Reported Profile/Item", 
        contentType: r.contentType, contentId: r.contentId,
        reason: r.reason, customReason: r.customReason, status: r.status, createdAt: r.createdAt,
      })),
      total, page, limit, totalPages: Math.ceil(total / limit),
    };
  } 

  async reviewContent(adminId: string, reportId: number, action: 'delete' | 'dismiss', notifyViolation?: boolean) {
    const report = await this.reportedContentRepo.findOne({ where: { reportId } });
    if (!report) throw new NotFoundException('Report not found');
    report.status = action === 'delete' ? 'deleted' : 'dismissed';
    report.reviewedBy = adminId;
    await this.reportedContentRepo.save(report);
    await this.adminAuthService.logActivity(adminId, action === 'delete' ? 'DELETE_CONTENT' : 'DISMISS_REPORT', 'Content', String(reportId), `${action === 'delete' ? 'Deleted' : 'Dismissed'} reported content from ${report.postOwnerName}`);
    
    if (action === 'delete' && notifyViolation && report.postOwnerId) {
      try {
        const user = await this.userRepo.findOne({ where: { userId: report.postOwnerId } });
        if (user && user.email) {
          await this.mailService.sendModerationEmail(
            user.email,
            user.fullName || report.postOwnerName,
            'تم حذف محتواك من قبل الإدارة لانتهاك معايير الموقع.',
            'WARNING'
          );
        }
      } catch (err) {
        console.error('Error sending violation email:', err);
      }
    }

    return { message: `Report has been ${action === 'delete' ? 'deleted' : 'dismissed'}.` };
  }

  async submitReport(data: Partial<ReportedContent>) {
    const report = this.reportedContentRepo.create(data);
    return this.reportedContentRepo.save(report);
  }
}
