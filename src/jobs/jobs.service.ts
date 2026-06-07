import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets, MoreThan, Not } from 'typeorm';
import { Job } from './job.entity.js';
import { Category } from './category.entity.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { FilterJobsDto } from './dto/filter-jobs.dto.js';
import { AiSmartService } from '../audit-logs/ai-smart.service.js';
import { AuditLog } from '../audit-logs/audit-log.entity.js';
import { CompaniesService } from '../companies/companies.service.js';
import { RatingsService } from '../ratings/ratings.service.js';

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
    private companiesService: CompaniesService,
    private ratingsService: RatingsService,
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

      // Ensure each allowed name exists (Core categories for filtering)
      for (const name of allowedNames) {
        const existing = await this.categoryRepo.findOne({ where: { name } });
        if (!existing) {
          console.log(`[Categories] Creating missing core category: ${name}`);
          await this.categoryRepo.save(this.categoryRepo.create({ 
            name, 
            nameEn: name === 'تقني' ? 'Tech' : name === 'غير تقني' ? 'Non-Tech' : 'Services' 
          }));
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
    try {
      const page = parseInt(filters.page || '1') || 1;
      const limit = parseInt(filters.limit || '10') || 10;
      const skip = (page - 1) * limit;

      const qb = this.repo
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.company', 'company')
        .leftJoinAndSelect('job.category', 'category')
        .leftJoinAndSelect('job.categories', 'categories')
        .leftJoinAndSelect('job.user', 'user')
        .leftJoin('job.applications', 'applications')
        .addSelect(['applications.applicationId', 'applications.status']);

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
        const locLower = filters.location.toLowerCase();
        const map: Record<string, string[]> = {
          cairo: ["القاهرة"], alexandria: ["الإسكندرية", "الاسكندرية"], giza: ["الجيزة"], qalyubia: ["القليوبية"],
          "port said": ["بورسعيد"], suez: ["السويس"], gharbia: ["الغربية"], dakahlia: ["الدقهلية"],
          ismailia: ["الإسماعيلية", "الاسماعيلية"], asyut: ["أسيوط", "اسيوط"], fayoum: ["الفيوم"],
          minya: ["المنيا"], qena: ["قنا"], sohag: ["سوهاج"], "beni suef": ["بني سويف"],
          aswan: ["أسوان", "اسوان"], "red sea": ["البحر الأحمر", "البحر الاحمر"],
          "new valley": ["الوادي الجديد"], matrouh: ["مطروح"], "north sinai": ["شمال سيناء"],
          "south sinai": ["جنوب سيناء"], "kafr el sheikh": ["كفر الشيخ"], beheira: ["البحيرة"],
          damietta: ["دمياط"], sharqia: ["الشرقية"], monufia: ["المنوفية"], luxor: ["الأقصر", "الاقصر"]
        };
        const arNames = map[locLower] || [];
        
        let locationConditions = '(LOWER(job.address) LIKE LOWER(:loc) OR LOWER(company.address) LIKE LOWER(:loc))';
        const params: Record<string, any> = { loc: `%${locLower}%` };
        
        arNames.forEach((name, idx) => {
          locationConditions += ` OR LOWER(job.address) LIKE LOWER(:arName${idx}) OR LOWER(company.address) LIKE LOWER(:arName${idx})`;
          params[`arName${idx}`] = `%${name}%`;
        });
        
        qb.andWhere(`(${locationConditions})`, params);
      }

      if (filters.jobType) {
        // jobType could be a comma-separated string from the frontend
        const types = filters.jobType.split(',').map(t => t.trim());
        qb.andWhere(new Brackets(qb => {
          types.forEach((t, idx) => {
            if (idx === 0) {
              qb.where(`job.jobType::jsonb ? :type${idx}`, { [`type${idx}`]: t });
            } else {
              qb.orWhere(`job.jobType::jsonb ? :type${idx}`, { [`type${idx}`]: t });
            }
          });
        }));
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

      if (filters.jobLevel) {
        const levels = filters.jobLevel.split(',').map(l => l.trim().toLowerCase());
        const mappedLevels = levels.map(l => {
          if (l === "technical" || l === "تقني") return "تقني";
          if (l === "non-technical" || l === "غير تقني") return "غير تقني";
          if (l === "services") return "خدمات";
          if (l === "tradesman" || l === "حرفي") return "tradesman";
          return l;
        });
        
        qb.andWhere(new Brackets(query => {
          if (mappedLevels.includes('tradesman')) {
            const otherLevels = mappedLevels.filter(l => l !== 'tradesman');
            if (otherLevels.length > 0) {
              query.where('LOWER(job.classification) IN (:...otherLevels)', { otherLevels })
                   .orWhere('job.userId IS NOT NULL');
            } else {
              query.where('job.userId IS NOT NULL');
            }
          } else {
            query.where('LOWER(job.classification) IN (:...mappedLevels)', { mappedLevels });
          }
        }));
      }

      if (filters.salaryRange) {
        const ranges = filters.salaryRange.split(',').map(r => r.trim());
        qb.andWhere(new Brackets(query => {
          ranges.forEach((range, idx) => {
            const prefix = idx === 0 ? 'where' : 'orWhere';
            if (range === "<700") {
              query[prefix]('(job.salary > 0 AND job.salary < 700) OR (job.salaryMin > 0 AND job.salaryMin < 700)');
            } else if (range === "700-1000") {
              query[prefix]('(job.salary >= 700 AND job.salary < 1000) OR (job.salaryMin >= 700 AND job.salaryMin < 1000)');
            } else if (range === "1000-1500") {
              query[prefix]('(job.salary >= 1000 AND job.salary < 1500) OR (job.salaryMin >= 1000 AND job.salaryMin < 1500)');
            } else if (range === "1500-2000") {
              query[prefix]('(job.salary >= 1500 AND job.salary < 2000) OR (job.salaryMin >= 1500 AND job.salaryMin < 2000)');
            } else if (range === "3000+") {
              query[prefix]('job.salary >= 3000 OR job.salaryMin >= 3000');
            } else if (range === "Not specified") {
              query[prefix]('job.salary IS NULL AND job.salaryMin IS NULL');
            }
          });
        }));
      }

      // Calculate Facets efficiently using a clone before pagination
      const facetQb = qb.clone();
      const allMatchingJobs = await facetQb.select([
        'job.jobId', 'job.jobType', 'job.salary', 'job.salaryMin', 
        'job.categoryId', 'job.classification', 'job.userId'
      ]).getMany();

      const facets = {
        jobType: {} as Record<string, number>,
        category: {} as Record<string, number>,
        level: {} as Record<string, number>,
        salary: {} as Record<string, number>,
      };

      allMatchingJobs.forEach(j => {
        // Job Type
        const types = Array.isArray(j.jobType) ? j.jobType : [];
        types.forEach(t => {
          let key = 'Full-time';
          const lowerT = String(t).toLowerCase();
          if (lowerT.includes('part')) key = 'Part-time';
          else if (lowerT.includes('freelance') || lowerT.includes('عمل حر')) key = 'Freelance';
          else if (lowerT.includes('intern')) key = 'Internship';
          else if (lowerT.includes('remote')) key = 'Remote';
          else if (lowerT.includes('one-time') || lowerT.includes('2')) key = 'One-time';
          facets.jobType[key] = (facets.jobType[key] || 0) + 1;
        });

        // Category (we group by categoryId but frontend maps it, so we map to names or ids)
        if (j.categoryId) {
           const idStr = j.categoryId.toString();
           facets.category[idStr] = (facets.category[idStr] || 0) + 1;
        }

        // Level (classification)
        let level = 'Other';
        const cls = String(j.classification).toLowerCase();
        if (j.userId) {
          level = 'Tradesman';
        } else if (cls === 'تقني') {
          level = 'Technical';
        } else if (cls === 'غير تقني') {
          level = 'Non-Technical';
        } else if (cls === 'خدمات') {
          level = 'Services';
        } else if (cls === 'tradesman') {
          level = 'Tradesman';
        }
        facets.level[level] = (facets.level[level] || 0) + 1;

        // Salary
        const sal = j.salary || j.salaryMin || 0;
        let salRange = 'Not specified';
        if (sal > 0 && sal < 700) salRange = '<700';
        else if (sal >= 700 && sal < 1000) salRange = '700-1000';
        else if (sal >= 1000 && sal < 1500) salRange = '1000-1500';
        else if (sal >= 1500 && sal < 2000) salRange = '1500-2000';
        else if (sal >= 3000) salRange = '3000+';
        facets.salary[salRange] = (facets.salary[salRange] || 0) + 1;
      });

      const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

      const mappedData = data.map(j => ({
        jobId: j.jobId,
        title: j.title,
        description: j.description,
        salary: j.salary ? Number(j.salary) : null,
        salaryMin: j.salaryMin ? Number(j.salaryMin) : null,
        salaryMax: j.salaryMax ? Number(j.salaryMax) : null,
        address: j.address,
        jobType: j.jobType,
        classification: j.classification || null,
        fieldOfWork: j.fieldOfWork || [],
        slotsAvailable: j.slotsAvailable,
        images: j.images || [],
        workTime: j.workTime || [],
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
        appliedCount: Array.isArray(j.applications) ? j.applications.length : 0,
        acceptedCount: Array.isArray(j.applications) ? j.applications.filter(a => a.status === 'accepted').length : 0,
        categories: Array.isArray((j as any).categories) ? (j as any).categories.map((c: any) => ({ categoryId: c.categoryId, name: c.name })) : [],
      }));

      // Fetch ratings in parallel for better performance
      const resultsWithRatings = await Promise.all(mappedData.map(async (job: any) => {
        let avgRating = 0;
        let jobRating = 0;
        
        // Fetch User/Company Overall Rating
        if (job.user) {
          avgRating = await this.ratingsService.getAverageRatingForUser(job.user.userId);
        } else if (job.company) {
          avgRating = await this.ratingsService.getAverageRatingForCompany(job.company.companyId);
        }
        
        // Fetch Rating for this specific Job
        jobRating = await this.ratingsService.getAverageRatingForJob(job.jobId);
        
        return { ...job, avgRating, jobRating };
      }));

      return {
        data: resultsWithRatings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / (limit || 1)),
        facets,
      };
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
  }

  async findOne(id: number) {
    const job = await this.repo.findOne({
      where: { jobId: id },
      relations: ['company', 'category', 'user', 'applications', 'categories'],
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async create(data: CreateJobDto) {
    // Handle multiple fields of work -> categories
    let resolvedCategories: Category[] = [];
    if (data.fieldOfWork && Array.isArray(data.fieldOfWork) && data.fieldOfWork.length > 0) {
      for (const fieldName of data.fieldOfWork) {
        let category = await this.categoryRepo.findOne({ where: { name: fieldName } });
        if (!category) {
          category = await this.categoryRepo.save(this.categoryRepo.create({ name: fieldName }));
        }
        resolvedCategories.push(category);
      }
      // Set the first category as the primary (backward compat)
      data.categoryId = resolvedCategories[0].categoryId;
    } else if (data.fieldOfWork && typeof data.fieldOfWork === 'string') {
      // Backward compat: single string
      let category = await this.categoryRepo.findOne({ where: { name: data.fieldOfWork as any } });
      if (!category) {
        category = await this.categoryRepo.save(this.categoryRepo.create({ name: data.fieldOfWork as any }));
      }
      resolvedCategories.push(category);
      data.categoryId = category.categoryId;
      data.fieldOfWork = [data.fieldOfWork as any];
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
    
    // Save ManyToMany categories
    if (resolvedCategories.length > 0) {
      saved.categories = resolvedCategories;
      await this.repo.save(saved);
    }
    
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
    // Handle multiple fields of work -> categories
    let resolvedCategories: Category[] | null = null;
    if (data.fieldOfWork && Array.isArray(data.fieldOfWork)) {
      resolvedCategories = [];
      if (data.fieldOfWork.length > 0) {
        for (const fieldName of data.fieldOfWork) {
          let category = await this.categoryRepo.findOne({ where: { name: fieldName } });
          if (!category) {
            category = await this.categoryRepo.save(this.categoryRepo.create({ name: fieldName }));
          }
          resolvedCategories.push(category);
        }
        data.categoryId = resolvedCategories[0].categoryId;
      } else {
        data.categoryId = undefined as any; // clear category if empty
      }
    } else if (data.fieldOfWork && typeof data.fieldOfWork === 'string') {
      // Backward compat: single string
      resolvedCategories = [];
      let category = await this.categoryRepo.findOne({ where: { name: data.fieldOfWork as any } });
      if (!category) {
        category = await this.categoryRepo.save(this.categoryRepo.create({ name: data.fieldOfWork as any }));
      }
      resolvedCategories.push(category);
      data.categoryId = category.categoryId;
      data.fieldOfWork = [data.fieldOfWork as any];
    }

    const job = await this.findOne(id);
    console.log(`[JobsService] Updating Job ID ${id}. New Title: ${data.title}`);
    
    // Explicitly update main fields to ensure TypeORM tracks changes
    if (data.title) job.title = data.title;
    if (data.description) job.description = data.description;
    
    Object.assign(job, data);
    
    // Update ManyToMany categories
    if (resolvedCategories !== null) {
      job.categories = resolvedCategories;
    }
    
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
    const qb = this.repo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.user', 'user')
      .leftJoinAndSelect('job.categories', 'categories')
      .where('job.isActive = :isActive', { isActive: true })
      .andWhere('job.jobId != :jobId', { jobId: id });

    if (job.categoryId) {
      qb.andWhere('job.categoryId = :categoryId', { categoryId: job.categoryId });
    }
    if (job.classification) {
      qb.andWhere('job.classification = :classification', { classification: job.classification });
    }
    if (job.companyId) {
      qb.andWhere('(job.companyId != :companyId OR job.companyId IS NULL)', { companyId: job.companyId });
    }
    if (job.userId) {
      qb.andWhere('(job.userId != :userId OR job.userId IS NULL)', { userId: job.userId });
    }

    return qb.take(4).getMany();
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
    // 1. Only count registered users
    if (!userId) return;

    // 2. Fetch the job to check ownership
    const job = await this.repo.findOne({ where: { jobId }, select: ['jobId', 'companyId', 'userId'] });
    if (!job) return;

    // 3. DO NOT count the owner (Company or Tradesman)
    if (job.userId === userId) return; // Tradesman owner
    
    if (job.companyId) {
      const company = await this.companiesService.findByContactEmailOrName(userId);
      if (company && Number(company.companyId) === Number(job.companyId)) {
        return; // This user belongs to the company that owns the job
      }
    }

    // 4. Anti-spam/Unique: Check 24h window
    const lockKey = `${jobId}_${userId}`;
    if (this.recentViewsLock.has(lockKey)) return;
    this.recentViewsLock.add(lockKey);
    setTimeout(() => this.recentViewsLock.delete(lockKey), 10000);

    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const existingLog = await this.auditLogRepo.findOne({
      where: {
        entity: 'Job',
        action: 'READ',
        entityId: String(jobId),
        userId: userId,
        timestamp: MoreThan(oneDayAgo)
      }
    });

    if (!existingLog) {
      const log = this.auditLogRepo.create({
        entity: 'Job',
        action: 'READ',
        entityId: String(jobId),
        userId: userId,
        metadata: { sessionId }
      });
      await this.auditLogRepo.save(log);
      console.log(`[JobsService] 📈 Unique View recorded for Job #${jobId}`);
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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyViewsRaw = await this.dataSource.query(
      `SELECT DATE(timestamp) as date, COUNT(*) as count 
       FROM ptj.audit_logs 
       WHERE entity = 'Job' AND action = 'READ' AND entity_id = $1 AND timestamp >= $2
       GROUP BY DATE(timestamp) 
       ORDER BY DATE(timestamp) ASC`,
      [String(jobId), thirtyDaysAgo]
    );

    const viewStats: { date: string; views: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      
      const match = dailyViewsRaw.find((r: any) => {
        const rDate = new Date(r.date);
        const rStr = rDate.getFullYear() + '-' + String(rDate.getMonth() + 1).padStart(2, '0') + '-' + String(rDate.getDate()).padStart(2, '0');
        return rStr === dateStr;
      });

      viewStats.push({
        date: dateStr,
        views: match ? parseInt(match.count) : 0
      });
    }

    return {
      totalViews,
      currentPeriodViews,
      previousPeriodViews: lastPeriodVal,
      percentageChange: Math.round(percentageChange * 10) / 10,
      trend: percentageChange >= 0 ? 'up' : 'down',
      viewStats
    };
  }
}
