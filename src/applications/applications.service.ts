import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './application.entity.js';
import { User } from '../users/user.entity.js';
import { ApplicantProfile } from '../users/applicant-profile.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import { AiMonitoringService } from '../audit-logs/ai-monitoring.service.js';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private repo: Repository<Application>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(ApplicantProfile)
    private profileRepo: Repository<ApplicantProfile>,
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
    const profile = await this.profileRepo.findOne({ where: { userId } });

    if (finalResumeUrl && finalResumeUrl.trim() !== '') {
      if (profile && profile.resumeUrl !== finalResumeUrl) {
        profile.resumeUrl = finalResumeUrl;
        await this.profileRepo.save(profile);
      } else if (!profile) {
        const newProfile = this.profileRepo.create({ userId, resumeUrl: finalResumeUrl });
        await this.profileRepo.save(newProfile);
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
    const app = await this.repo.findOne({
      where: { applicationId },
      relations: ['user', 'user.applicantProfile', 'job', 'job.company', 'job.category'],
    });

    console.log(`🕵️‍♂️ [Backend] findOne(${applicationId}) - user loaded: ${!!app?.user}, profile loaded: ${!!app?.user?.applicantProfile}`);

    if (app && app.user && app.user.applicantProfile) {
      // Flatten the profile data into the user object for the frontend
      const p = app.user.applicantProfile;
      console.log(`🕵️‍♂️ [Backend] Profile data: skills=${p.skills?.length}, bio=${!!p.bio}`);
      Object.assign(app.user, {
        bio: p.bio,
        skills: p.skills,
        experiences: p.experiences,
        educations: p.educations,
        portfolios: p.portfolios,
        languages: p.languages,
        socialLinks: p.socialLinks,
        dob: p.dob,
        gender: p.gender,
        experience: p.experienceYears
      });
      delete (app.user as any).applicantProfile;
    }

    return app;
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
