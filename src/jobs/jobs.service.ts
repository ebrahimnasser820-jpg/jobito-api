import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets, MoreThan } from 'typeorm';
import { Job } from './job.entity.js';
import { Category } from './category.entity.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { FilterJobsDto } from './dto/filter-jobs.dto.js';
import { AiSmartService } from '../audit-logs/ai-smart.service.js';
import { AuditLog } from '../audit-logs/audit-log.entity.js';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private repo: Repository<Job>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    private dataSource: DataSource,
    private aiSmartService: AiSmartService,
  ) {}

  async findAllCategories() {
    try {
      // 1. Self-Healing & Migration: Ensure the core categories exist and rename old ones
      const allowedNames = ['تقني', 'غير تقني', 'خدمات'];
      
      // Migrate "حرفي" or "صنيعي" to "خدمات"
      await this.categoryRepo.createQueryBuilder()
        .update(Category)
        .set({ name: 'خدمات', nameEn: 'Services' })
        .where('name IN (:...oldNames)', { oldNames: ['حرفي', 'صنيعي'] })
        .execute();

      // Migrate ALL JOBS classification field to "خدمات"
      await this.repo.createQueryBuilder()
        .update(Job)
        .set({ classification: 'خدمات' })
        .where('classification IN (:...oldClasses)', { oldClasses: ['حرفي', 'صنيعي', 'خددمات'] })
        .execute();

      // Ensure each allowed name exists
      for (const name of allowedNames) {
        const existing = await this.categoryRepo.findOne({ where: { name } });
        if (!existing) {
          console.log(`[Categories] Creating missing category: ${name}`);
          await this.categoryRepo.save(this.categoryRepo.create({ 
            name, 
            nameEn: name === 'تقني' ? 'Tech' : name === 'غير تقني' ? 'Non-Tech' : 'Services' 
          }));
        }
      }

      // Cleanup: Delete any categories that are NOT in the allowed list
      const allCurrent = await this.categoryRepo.find();
      for (const c of allCurrent) {
        if (!allowedNames.includes(c.name.trim())) {
          console.log(`[Categories] Deleting unwanted category: ${c.name}`);
          await this.repo.createQueryBuilder()
            .update(Job)
            .set({ categoryId: null })
            .where('categoryId = :id', { id: c.categoryId })
            .execute();
          await this.categoryRepo.delete(c.categoryId);
        }
      }

      const categories = await this.categoryRepo.find();
      const result: any[] = [];

      for (const cat of categories) {
        let count = 0;
        const name = cat.name.trim();

        if (name === 'تقني') {
          count = await this.repo.createQueryBuilder('job')
            .where('job.isActive = :isActive', { isActive: true })
            .andWhere(new Brackets(qb => { 
              qb.where('job.categoryId = :catId', { catId: cat.categoryId })
                .orWhere('job.classification = :cls', { cls: 'تقني' });
            }))
            .getCount();
        } else if (name === 'غير تقني') {
          count = await this.repo.createQueryBuilder('job')
            .where('job.isActive = :isActive', { isActive: true })
            .andWhere(new Brackets(qb => {
              qb.where('job.categoryId = :catId', { catId: cat.categoryId })
                .orWhere('job.classification = :cls', { cls: 'غير تقني' });
            }))
            .getCount();
        } else if (name === 'خدمات') {
          count = await this.repo.createQueryBuilder('job')
            .where('job.isActive = :isActive', { isActive: true })
            .andWhere(new Brackets(qb => {
              qb.where('job.categoryId = :catId', { catId: cat.categoryId })
                .orWhere('job.classification = :cls', { cls: 'خدمات' });
            }))
            .getCount();
        } else {
          count = await this.repo.count({ where: { categoryId: cat.categoryId, isActive: true } });
        }

        result.push({
          ...cat,
          jobCount: parseInt(count.toString())
        });
      }
      
      return result;
    } catch (error: unknown) {
      console.error('CRASH in findAllCategories:', error);
      return [];
    }
  }
  async seedCategories() {
    // 1. Cleanup: Trim all existing category names and merge duplicates
    const allExisting = await this.categoryRepo.find();
    for (const cat of allExisting) {
      const trimmedName = cat.name.trim();
      if (trimmedName !== cat.name) {
        console.log(`[Seed] Trimming category: "${cat.name}" -> "${trimmedName}"`);
        const target = await this.categoryRepo.findOne({ where: { name: trimmedName } });
        if (target && target.categoryId !== cat.categoryId) {
          // Merge: Move jobs from cat to target
          await this.repo.createQueryBuilder()
            .update(Job)
            .set({ categoryId: target.categoryId })
            .where('categoryId = :oldId', { oldId: cat.categoryId })
            .execute();
          await this.categoryRepo.delete(cat.categoryId);
          console.log(`[Seed] Merged "${cat.name}" into "${trimmedName}"`);
        } else {
          cat.name = trimmedName;
          await this.categoryRepo.save(cat);
        }
      }
    }

    const categories = [
      { name: 'تقني', nameEn: 'Tech', description: 'وظائف تقنية وبرمجية', descriptionEn: 'Technical and programming jobs' },
      { name: 'غير تقني', nameEn: 'Non-Tech', description: 'وظائف إدارية وغير تقنية', descriptionEn: 'Administrative and non-technical jobs' },
      { name: 'خدمات', nameEn: 'Services', description: 'خدمات عامة ووظائف مهنية', descriptionEn: 'Public services and professional trades' },
    ];

    for (const cat of categories) {
      const existing = await this.categoryRepo.findOne({ where: { name: cat.name } });
      const savedCategory = existing 
        ? Object.assign(existing, cat) 
        : this.categoryRepo.create(cat);
      const finalCat = await this.categoryRepo.save(savedCategory);

      if (finalCat.name === 'تقني') {
        const jobs = await this.repo.createQueryBuilder('job')
          .where('job.title LIKE :query1', { query1: '%تقن%' })
          .orWhere('LOWER(job.title) LIKE :query2', { query2: '%tech%' })
          .getMany();
        
        if (jobs.length > 0) {
          console.log(`[Seed] Smart linking ${jobs.length} jobs to "تقني"`);
          await this.repo.createQueryBuilder()
            .update(Job)
            .set({ categoryId: finalCat.categoryId })
            .whereInIds(jobs.map(j => j.jobId))
            .execute();
        }
      }
    }
    return { message: 'Categories seeded successfully', count: categories.length };
  }

  async findAll(filters: FilterJobsDto) {
    console.log('🔍 [JobsService.findAll] DB QUERY with filters:', JSON.stringify(filters));
    try {
      const page = parseInt(filters.page || '1') || 1;
      const limit = parseInt(filters.limit || '10') || 10;
      const skip = (page - 1) * limit;

      const qb = this.repo
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.company', 'company')
        .leftJoinAndSelect('job.category', 'category')
        .leftJoinAndSelect('job.user', 'user')
        .leftJoin('job.applications', 'applications')
        .addSelect(['applications.applicationId']);

      qb.where('1=1');

      if (filters.companyId && !isNaN(parseInt(filters.companyId))) {
        qb.andWhere('job.companyId = :compId', {
          compId: parseInt(filters.companyId),
        });
      } else if (filters.userId) {
        qb.andWhere('job.userId = :userId', {
          userId: filters.userId,
        });
      } else {
        qb.andWhere('job.isActive = :active', { active: true });
      }

      if (filters.search) {
        // 🧠 AI Smart Search: expand query to related tags, then search by all
        const expandedTags = this.aiSmartService.expandQuery(filters.search);
        const allSearchTerms = [filters.search, ...expandedTags];
        const likeConditions = allSearchTerms.map((_, i) => 
          `(LOWER(job.title) LIKE LOWER(:tag${i}) OR LOWER(job.description) LIKE LOWER(:tag${i}))`
        ).join(' OR ');
        const tagParams: Record<string, string> = {};
        allSearchTerms.forEach((term, i) => { tagParams[`tag${i}`] = `%${term}%`; });

        qb.andWhere(
          `(to_tsvector('simple', COALESCE(job.title, '') || ' ' || COALESCE(job.description, '')) @@ plainto_tsquery('simple', :search)
           OR ${likeConditions})`,
          { search: filters.search, ...tagParams },
        );
      }

      qb.orderBy('job.updatedAt', 'DESC');
      
      if (filters.location) {
        qb.andWhere('LOWER(job.address) LIKE LOWER(:location)', { 
          location: `%${filters.location}%` 
        });
      }

      if (filters.jobType) {
        qb.andWhere('job.jobType = :jobType', { jobType: filters.jobType });
      }

      if (filters.categoryId && !isNaN(parseInt(filters.categoryId))) {
        qb.andWhere('job.categoryId = :catId', {
          catId: parseInt(filters.categoryId),
        });
      }

      if (filters.classification) {
        qb.andWhere('job.classification = :classification', {
          classification: filters.classification,
        });
      }

      if (filters.excludeClassification) {
        qb.andWhere('job.classification != :excludeCls', {
          excludeCls: filters.excludeClassification,
        });
      }

      // Order is already set by Semantic Search or fallback
      
      const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

      const result = {
        data: data.map(j => ({
          jobId: j.jobId,
          title: j.title,
          description: j.description,
          salary: j.salary ? Number(j.salary) : null,
          salaryMin: j.salaryMin ? Number(j.salaryMin) : null,
          salaryMax: j.salaryMax ? Number(j.salaryMax) : null,
          address: j.address,
          jobType: j.jobType,
          classification: j.classification || null,
          slotsAvailable: j.slotsAvailable,
          isActive: j.isActive,
          createdAt: j.createdAt,
          company: j.company ? { 
            companyId: j.company.companyId, 
            name: j.company.name, 
            logoUrl: j.company.logoUrl 
          } : undefined,
          category: j.category ? { 
            categoryId: j.category.categoryId, 
            name: j.category.name 
          } : undefined,
          user: j.user ? {
            userId: j.user.userId,
            fullName: j.user.fullName,
            avatarUrl: j.user.avatarUrl
          } : undefined,
          appliedCount: Array.isArray(j.applications) ? j.applications.length : 0
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / (limit || 1)),
      };

      return result;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('CRASH in findAll jobs:', err);
      return {
        data: [],
        total: 0,
        page: parseInt(filters.page || '1') || 1,
        limit: parseInt(filters.limit || '10') || 10,
        totalPages: 0
      };
    }
  }

  private async invalidateCache() {
    // Redis logic removed
  }

  async findOne(id: number) {
    const job = await this.repo.findOne({
      where: { jobId: id },
      relations: ['company', 'category', 'user', 'applications'],
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async create(data: CreateJobDto) {
    if (data.categoryName && !data.categoryId) {
      let category = await this.categoryRepo.findOne({
        where: { name: data.categoryName },
      });
      if (!category) {
        category = await this.categoryRepo.save(
          this.categoryRepo.create({ name: data.categoryName }),
        );
      }
      data.categoryId = category.categoryId;
    }

    // Ownership Validation
    if (!data.companyId && !data.userId) {
      throw new Error('A job must have exactly one owner: either companyId or userId.');
    }
    if (data.companyId && data.userId) {
      throw new Error('A job cannot have both companyId and userId owners.');
    }
    const job = this.repo.create(data);
    const saved = await this.repo.save(job);
    await this.invalidateCache();
    return saved;
  }

  async createBulk(data: CreateJobDto[]) {
    const jobs = this.repo.create(data);
    const saved = await this.repo.save(jobs);
    await this.invalidateCache();
    return saved;
  }

  async update(id: number, data: UpdateJobDto) {
    if (data.categoryName && !data.categoryId) {
      let category = await this.categoryRepo.findOne({
        where: { name: data.categoryName },
      });
      if (!category) {
        category = await this.categoryRepo.save(
          this.categoryRepo.create({ name: data.categoryName }),
        );
      }
      data.categoryId = category.categoryId;
    }
    const job = await this.findOne(id);
    Object.assign(job, data);
    const saved = await this.repo.save(job);
    await this.invalidateCache();
    return saved;
  }

  async remove(id: number) {
    const job = await this.findOne(id);
    await this.repo.remove(job);
    await this.invalidateCache();
    return { success: true };
  }

  async getNearbyJobs(
    lon: number,
    lat: number,
    radius: number,
  ): Promise<Record<string, any>[]> {
    const query = `
      SELECT * FROM (
        SELECT j.job_id AS "jobId", j.title, j.description, j.salary, j.job_type AS "jobType", j.slots_available AS "slotsAvailable",
               j.address, j.latitude, j.longitude, j.created_at AS "createdAt",
               c.company_id AS "companyId", c.name as "companyName",
               cat.category_id AS "categoryId", cat.name as "categoryName",
               (6371000 * acos(cos(radians($2)) * cos(radians(j.latitude)) * cos(radians(j.longitude) - radians($1)) + sin(radians($2)) * sin(radians(j.latitude)))) AS distance_m
        FROM ptj.jobs j
        LEFT JOIN ptj.companies c ON j.company_id = c.company_id
        LEFT JOIN ptj.categories cat ON j.category_id = cat.category_id
        WHERE j.is_active = true
          AND j.latitude IS NOT NULL 
          AND j.longitude IS NOT NULL
      ) AS jobs_with_distance
      WHERE distance_m <= $3
      ORDER BY distance_m ASC
    `;
    return this.dataSource.query(query, [lon, lat, radius]);
  }

  async getSimilarJobs(id: number) {
    const job = await this.findOne(id);
    return this.repo
      .find({
        where: {
          ...(job.categoryId && { categoryId: job.categoryId }),
          isActive: true,
        },
        relations: ['company', 'category', 'user'],
        take: 4,
      })
      .then((jobs) => jobs.filter((j) => Number(j.jobId) !== id));
  }

  async getApplicationCount(jobId: number): Promise<number> {
    const result = await this.dataSource.query<{ count: string }[]>(
      'SELECT COUNT(*) as count FROM ptj.applications WHERE job_id = $1',
      [jobId],
    );
    return parseInt(result[0]?.count || '0');
  }

  private recentViewsLock = new Set<string>();

  async recordView(jobId: number, userId?: string, sessionId?: string): Promise<void> {
    // 1. Do not count guest users. Only count registered applicants.
    if (!userId) {
      return; 
    }

    // Anti-Race Condition Lock: Prevent instant double counting (e.g., from React Strict Mode)
    const lockKey = `${jobId}_${userId}`;
    if (this.recentViewsLock.has(lockKey)) {
      return;
    }
    this.recentViewsLock.add(lockKey);
    // Release the memory lock after 10 seconds
    setTimeout(() => this.recentViewsLock.delete(lockKey), 10000);

    // 2. Extend anti-spam window to 24 hours (1 day)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    // Build query to check if THIS specific user viewed THIS job within the last 24 hours
    const qb = this.auditLogRepo.createQueryBuilder('log')
      .where('log.entity = :entity', { entity: 'Job' })
      .andWhere('log.action = :action', { action: 'READ' })
      .andWhere('log.entityId = :entityId', { entityId: String(jobId) })
      .andWhere('log.userId = :userId', { userId })
      .andWhere('log.timestamp > :oneDayAgo', { oneDayAgo });

    const existingLog = await qb.getOne();

    // 3. Increment by 1 only if no record exists in the past 24 hours
    if (!existingLog) {
      const log = new AuditLog();
      log.entity = 'Job';
      log.action = 'READ';
      log.entityId = String(jobId);
      log.userId = userId; // Guaranteed to be a registered user
      log.metadata = { sessionId };
      await this.auditLogRepo.save(log);
      console.log(`[JobsService] ✅ View recorded for Job #${jobId} (User: ${userId})`);
    }
  }

  async getJobAnalytics(jobId: number) {
    const now = new Date();
    const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const startOfLastWeek = new Date(startOfThisWeek.getFullYear(), startOfThisWeek.getMonth(), startOfThisWeek.getDate() - 7);

    const totalViews = await this.auditLogRepo.count({ 
      where: { entity: 'Job', action: 'READ', entityId: String(jobId) } 
    });

    // Use the native query below to get the last period views precisely
    const currentPeriodViews = await this.auditLogRepo.count({
      where: {
        entity: 'Job',
        action: 'READ',
        entityId: String(jobId),
        timestamp: MoreThan(startOfThisWeek)
      }
    });

    // Proper way for TypeORM between dates using AuditLog
    const lastPeriodCount = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ptj.audit_logs 
       WHERE entity = 'Job' AND action = 'READ' AND entity_id = $1 
       AND timestamp >= $2 AND timestamp < $3`,
      [String(jobId), startOfLastWeek, startOfThisWeek]
    );
    const lastPeriodVal = parseInt(lastPeriodCount[0]?.count || '0');

    let percentageChange = 0;
    if (lastPeriodVal > 0) {
      percentageChange = ((currentPeriodViews - lastPeriodVal) / lastPeriodVal) * 100;
    } else if (currentPeriodViews > 0) {
      percentageChange = 100; 
    }

    return {
      totalViews,
      currentPeriodViews,
      previousPeriodViews: lastPeriodVal,
      percentageChange: Math.round(percentageChange * 10) / 10,
      trend: percentageChange >= 0 ? 'up' : 'down'
    };
  }
}
