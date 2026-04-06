import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './application.entity.js';
import { User } from '../users/user.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import { AiMonitoringService } from '../audit-logs/ai-monitoring.service.js';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private repo: Repository<Application>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jobsService: JobsService,
    private aiMonitoringService: AiMonitoringService,
  ) {}

  async apply(userId: string, jobId: number, data?: { portfolioUrl?: string; coverLetter?: string; resumeUrl?: string }) {
    // Check if job exists
    const job = await this.jobsService.findOne(jobId);

    // Check if job is active
    if (!job.isActive) {
      throw new BadRequestException('هذه الوظيفة مغلقة ولا يمكن التقديم عليها');
    }

    // Check slots (fallback to 10 if slotsAvailable is null/undefined)
    const maxSlots = job.slotsAvailable || 10;
    const appliedCount = await this.jobsService.getApplicationCount(jobId);
    if (appliedCount >= maxSlots) {
      throw new BadRequestException('هذه الوظيفة وصلت الحد الأقصى للمتقدمين');
    }

    // Check if already applied
    const existing = await this.repo.findOne({
      where: { userId, jobId },
    });
    if (existing) {
      throw new BadRequestException('لقد تقدمت بالفعل لهذه الوظيفة');
    }

    let finalResumeUrl = data?.resumeUrl;
    const user = await this.userRepo.findOne({ where: { userId } });

    if (!finalResumeUrl || finalResumeUrl.trim() === '') {
      if (user && user.resumeUrl) {
        finalResumeUrl = user.resumeUrl;
      }
    } else {
      if (user && user.resumeUrl !== finalResumeUrl) {
        user.resumeUrl = finalResumeUrl;
        await this.userRepo.save(user);
      }
    }

    // Create application
    const application = this.repo.create({
      userId,
      jobId,
      portfolioUrl: data?.portfolioUrl,
      coverLetter: data?.coverLetter,
      resumeUrl: finalResumeUrl,
    });
    await this.repo.save(application);

    return { message: 'Application submitted successfully' };
  }

  async getMyApplications(userId: string) {
    return this.repo.find({
      where: { userId },
      relations: ['job', 'job.company', 'job.category'],
      order: { appliedAt: 'DESC' },
    });
  }

  async getJobApplications(jobId: number) {
    return this.repo.find({
      where: { jobId },
      relations: ['user', 'job', 'job.company', 'job.category'],
      order: { appliedAt: 'DESC' },
    });
  }

  async findOne(applicationId: number) {
    return this.repo.findOne({
      where: { applicationId },
      relations: ['user', 'job', 'job.company', 'job.category'],
    });
  }

  async updateStatus(applicationId: number, status: string, adminId?: string) {
    const app = await this.repo.findOne({ where: { applicationId } });
    if (!app) throw new Error('Application not found');
    
    app.status = status;
    const updated = await this.repo.save(app);

    // Log the decision in audit logs
    await this.aiMonitoringService.analyzeTraffic({
      method: 'STATUS_UPDATE',
      url: `/applications/${applicationId}/status`,
      reqBody: { status },
      resBody: { success: true, newStatus: status },
      userId: adminId || 'SYSTEM',
      duration: 0,
      statusCode: 200,
    });

    return updated;
  }

  async deleteApplication(applicationId: number, adminId: string) {
    const app = await this.repo.findOne({ where: { applicationId } });
    if (!app) throw new Error('Application not found');
    
    await this.repo.remove(app);

    // Log the deletion in audit logs
    await this.aiMonitoringService.analyzeTraffic({
      method: 'DELETE',
      url: `/applications/${applicationId}`,
      reqBody: {},
      resBody: { success: true, deletedId: applicationId },
      userId: adminId || 'SYSTEM',
      duration: 0,
      statusCode: 200,
    });

    return { message: 'Application deleted successfully' };
  }

  async getUserApplicationForJob(userId: string, jobId: number) {
    return this.repo.findOne({
      where: { userId, jobId },
    });
  }
}
