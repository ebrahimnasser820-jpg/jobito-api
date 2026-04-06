import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, MoreThan } from 'typeorm';
import { Company } from './company.entity.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { AuditLog } from '../audit-logs/audit-log.entity.js';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private repo: Repository<Company>,
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {}

  async findAll(filters: any) {
    console.log('🔍 [CompaniesService.findAll] DB QUERY with filters:', JSON.stringify(filters));
    
    const page = parseInt(filters.page || '1') || 1;
    const limit = parseInt(filters.limit || '100') || 100;
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('company')
      .leftJoinAndSelect('company.jobs', 'job')
      .leftJoinAndSelect('job.category', 'category');

    if (filters.search) {
      qb.andWhere(
        `(to_tsvector('simple', COALESCE(company.name, '') || ' ' || COALESCE(company.description, '')) @@ plainto_tsquery('simple', :search)
         OR LOWER(company.name) LIKE LOWER(:likeSearch)
         OR LOWER(company.description) LIKE LOWER(:likeSearch))`,
        { search: filters.search, likeSearch: `%${filters.search}%` }
      );
    }

    if (filters.industry) {
      qb.andWhere('LOWER(company.industry) = LOWER(:industry)', { industry: filters.industry });
    }

    if (filters.classification) {
      qb.andWhere('LOWER(company.classification) = LOWER(:classification)', { classification: filters.classification });
    }

    if (filters.employees) {
      qb.andWhere('company.employees = :employees', { employees: filters.employees });
    }

    qb.orderBy('company.companyId', 'DESC');


    const [companies, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Remove circular references caused by eager relations
    companies.forEach((com) => {
      if (com.jobs) {
        com.jobs.forEach((job: any) => {
          delete job.company;
        });
      }
    });

    const result = {
      data: companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return result;
  }

  async findOne(id: number) {
    const company = await this.repo.findOne({
      where: { companyId: id },
      relations: ['jobs', 'jobs.category'],
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async findByContactEmailOrName(email: string) {
    if (!email) return null;
    return this.repo.createQueryBuilder('company')
      .where('LOWER(company.contactEmail) = LOWER(:email)', { email })
      .orWhere('LOWER(company.name) = LOWER(:name)', { name: email }) // email could be name in some contexts
      .orderBy('company.companyId', 'DESC')
      .getOne();
  }

  async create(data: CreateCompanyDto) {
    const company = this.repo.create(data);
    return this.repo.save(company);
  }

  async update(id: number, data: UpdateCompanyDto) {
    const company = await this.findOne(id);
    Object.assign(company, data);
    return this.repo.save(company);
  }

  async getDashboardSummary(id: number) {
    const company = await this.repo.findOne({
      where: { companyId: id },
      relations: ['jobs', 'jobs.applications'],
    });

    if (!company) throw new NotFoundException('Company not found');

    const jobs = company.jobs || [];

    // Count total applications (new candidates)
    let totalApplications = 0;
    let todayApplications = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const job of jobs) {
      const apps = job.applications || [];
      totalApplications += apps.length;
      todayApplications += apps.filter((a: { appliedAt: string | Date }) => {
        const appliedDate = new Date(a.appliedAt);
        appliedDate.setHours(0, 0, 0, 0);
        return appliedDate.getTime() === today.getTime();
      }).length;
    }

    // New: Calculate Job Views for the company using AuditLog
    const jobIds = jobs.map(j => String(j.jobId)); // AuditLog entityId is string
    let totalViews = 0;
    let prevViews = 0;
    let currentViews = 0;

    if (jobIds.length > 0) {
      totalViews = await this.auditLogRepo.count({
        where: { entity: 'Job', action: 'READ', entityId: In(jobIds) }
      });

      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      currentViews = await this.auditLogRepo.count({
        where: { 
          entity: 'Job', 
          action: 'READ', 
          entityId: In(jobIds), 
          timestamp: MoreThan(lastWeek) 
        } as any
      });

      const prevCountResult = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM ptj.audit_logs 
         WHERE entity = 'Job' AND action = 'READ' AND entity_id = ANY($1) 
         AND timestamp >= $2 AND timestamp < $3`,
        [jobIds, twoWeeksAgo, lastWeek]
      );
      prevViews = parseInt(prevCountResult[0]?.count || '0');
    }

    let percentageChange = 0;
    if (prevViews > 0) {
      percentageChange = ((currentViews - prevViews) / prevViews) * 100;
    } else if (currentViews > 0) {
      percentageChange = 100;
    }

    return {
      new_candidates: totalApplications,
      schedule_today: todayApplications,
      messages_received: totalViews, 
      total_views: totalViews,
      view_change: Math.round(percentageChange * 10) / 10,
      total_jobs: jobs.length,
    };
  }

  async getStatistics(id: number, period: string = 'Week') {
    const company = await this.repo.findOne({
      where: { companyId: id },
      relations: ['jobs', 'jobs.applications'],
    });

    if (!company) throw new NotFoundException('Company not found');

    const jobs = company.jobs || [];
    const totalJobs = jobs.filter(j => j.isActive).length;

    // Count applications per job type
    const applicantCounts: Record<string, number> = {
      'full-time': 0,
      'part-time': 0,
      'remote': 0,
      'internship': 0,
      'contract': 0,
    };

    jobs.forEach(job => {
      const count = job.applications?.length || 0;
      const type = job.jobType?.toLowerCase();
      if (applicantCounts.hasOwnProperty(type)) {
        applicantCounts[type] += count;
      }
    });

    const totalApplied = Object.values(applicantCounts).reduce((a, b) => a + b, 0);

    const colorMap: Record<string, string> = {
      'full-time': '#5484C4',
      'part-time': '#4AD991',
      'remote': '#5484C4', // Based on image blue, potentially similar to fulltime
      'internship': '#FFA524',
      'contract': '#FF5959',
    };

    const labelMap: Record<string, string> = {
      'full-time': 'Full Time',
      'part-time': 'Part-Time',
      'remote': 'Remote',
      'internship': 'Internship',
      'contract': 'Contract',
    };

    const applicantsData = Object.entries(applicantCounts).map(([type, count]) => ({
      label: labelMap[type] || type,
      count,
      color: colorMap[type] || '#5484C4',
    }));

    const now = new Date();
    let labels: string[] = [];
    let applied: number[] = [];
    let views: number[] = [];
    const jobIdsStr = jobs.map(j => String(j.jobId));
    const jobIdsNum = jobs.map(j => Number(j.jobId));
    
    if (jobIdsStr.length > 0) {
      if (period === 'Week') {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        startOfWeek.setHours(0,0,0,0);

        // --- Real Views SQL (LOGGED IN USERS ONLY) ---
        const dailyViews = await this.dataSource.query(
          `SELECT EXTRACT(DOW FROM timestamp) as dow, COUNT(*) as count 
           FROM ptj.audit_logs 
           WHERE entity = 'Job' AND action = 'READ' AND entity_id = ANY($1) 
           AND user_id IS NOT NULL AND timestamp >= $2
           GROUP BY dow`,
          [jobIdsStr, startOfWeek]
        );
        const viewDowMap: Record<number, number> = {};
        dailyViews.forEach((v: any) => viewDowMap[parseInt(v.dow)] = parseInt(v.count));
        views = [1, 2, 3, 4, 5, 6, 0].map(d => viewDowMap[d] || 0);

        // --- Real Applications SQL ---
        const dailyApps = await this.dataSource.query(
          `SELECT EXTRACT(DOW FROM applied_at) as dow, COUNT(*) as count 
           FROM ptj.applications 
           WHERE job_id = ANY($1) AND applied_at >= $2
           GROUP BY dow`,
          [jobIdsNum, startOfWeek]
        );
        const appDowMap: Record<number, number> = {};
        dailyApps.forEach((v: any) => appDowMap[parseInt(v.dow)] = parseInt(v.count));
        applied = [1, 2, 3, 4, 5, 6, 0].map(d => appDowMap[d] || 0);

      } else if (period === 'Month') {
        labels = ['W1', 'W2', 'W3', 'W4'];
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 28);
        startOfMonth.setHours(0,0,0,0);

        // --- Real Views SQL (LOGGED IN USERS ONLY) ---
        const weeklyViews = await this.dataSource.query(
          `SELECT floor(EXTRACT(day from (timestamp - $2)) / 7) as week_idx, COUNT(*) as count 
           FROM ptj.audit_logs 
           WHERE entity = 'Job' AND action = 'READ' AND entity_id = ANY($1) 
           AND user_id IS NOT NULL AND timestamp >= $2
           GROUP BY week_idx`,
          [jobIdsStr, startOfMonth]
        );
        const viewWeekMap: Record<number, number> = {};
        weeklyViews.forEach((v: any) => viewWeekMap[parseInt(v.week_idx)] = parseInt(v.count));
        views = [0, 1, 2, 3].map(w => viewWeekMap[w] || 0);

        // --- Real Applications SQL ---
        const weeklyApps = await this.dataSource.query(
          `SELECT floor(EXTRACT(day from (applied_at - $2)) / 7) as week_idx, COUNT(*) as count 
           FROM ptj.applications 
           WHERE job_id = ANY($1) AND applied_at >= $2
           GROUP BY week_idx`,
          [jobIdsNum, startOfMonth]
        );
        const appWeekMap: Record<number, number> = {};
        weeklyApps.forEach((v: any) => appWeekMap[parseInt(v.week_idx)] = parseInt(v.count));
        applied = [0, 1, 2, 3].map(w => appWeekMap[w] || 0);

      } else if (period === 'Year') {
        labels = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'];
        const startOfYear = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        startOfYear.setHours(0,0,0,0);

        // --- Real Views SQL (LOGGED IN USERS ONLY) ---
        const monthlyViews = await this.dataSource.query(
          `SELECT EXTRACT(MONTH FROM timestamp) as month, COUNT(*) as count 
           FROM ptj.audit_logs 
           WHERE entity = 'Job' AND action = 'READ' AND entity_id = ANY($1) 
           AND user_id IS NOT NULL AND timestamp >= $2
           GROUP BY month`,
          [jobIdsStr, startOfYear]
        );
        const viewMonthMap: Record<number, number> = {};
        monthlyViews.forEach((v: any) => viewMonthMap[parseInt(v.month)] = parseInt(v.count));
        views = [1, 3, 5, 7, 9, 11].map(m => (viewMonthMap[m] || 0) + (viewMonthMap[m+1] || 0));

        // --- Real Applications SQL ---
        const monthlyApps = await this.dataSource.query(
          `SELECT EXTRACT(MONTH FROM applied_at) as month, COUNT(*) as count 
           FROM ptj.applications 
           WHERE job_id = ANY($1) AND applied_at >= $2
           GROUP BY month`,
          [jobIdsNum, startOfYear]
        );
        const appMonthMap: Record<number, number> = {};
        monthlyApps.forEach((v: any) => appMonthMap[parseInt(v.month)] = parseInt(v.count));
        applied = [1, 3, 5, 7, 9, 11].map(m => (appMonthMap[m] || 0) + (appMonthMap[m+1] || 0));
      }
    } else {
      views = period === 'Year' ? [0, 0, 0, 0, 0, 0] : (period === 'Month' ? [0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0]);
      applied = period === 'Year' ? [0, 0, 0, 0, 0, 0] : (period === 'Month' ? [0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0]);
      labels = period === 'Year' ? ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'] : (period === 'Month' ? ['W1', 'W2', 'W3', 'W4'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    }

    return {
      labels,
      views: views.map((v) => Math.round(v)),
      applied: applied.map((a) => Math.round(a)),
      summary: {
        views: {
          total: views.reduce((a, b) => a + b, 0).toLocaleString(),
          trend: 'Live',
          isUp: true,
        },
        applied: {
          total: totalApplied.toLocaleString(),
          trend: '12.4%',
          isUp: true,
        },
        jobOpen: totalJobs,
        applicants: applicantsData,
      },
    };
  }
}