import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/job.entity.js';

// ─── Role Tag Definitions ────────────────────────────────────
// Each category maps to a list of tags used for auto-tagging and search expansion

const ROLE_TAG_RULES: Record<string, string[]> = {
  // Programming & Software
  programming: [
    'frontend', 'backend', 'fullstack', 'mobile', 'devops', 'software',
    'web', 'api', 'database', 'cloud', 'security', 'testing', 'qa',
  ],
  frontend: ['web', 'programming', 'ui', 'design'],
  backend: ['web', 'programming', 'api', 'database'],
  fullstack: ['frontend', 'backend', 'web', 'programming'],
  mobile: ['programming', 'app', 'ios', 'android'],
  devops: ['programming', 'cloud', 'infrastructure'],

  // Design
  design: ['ui', 'ux', 'graphic', 'creative', 'visual'],
  ui: ['design', 'frontend', 'web'],
  ux: ['design', 'research', 'user'],
  graphic: ['design', 'creative', 'visual', 'branding'],

  // Marketing
  marketing: ['digital', 'social', 'seo', 'content', 'advertising', 'branding'],
  seo: ['marketing', 'digital', 'web'],
  content: ['marketing', 'writing', 'creative'],

  // Business & Management
  management: ['leadership', 'operations', 'strategy', 'hr'],
  hr: ['management', 'recruitment', 'people'],
  finance: ['accounting', 'business', 'banking', 'audit'],
  accounting: ['finance', 'business', 'audit', 'tax'],
  sales: ['marketing', 'business', 'customer'],

  // Engineering & Technical
  engineering: ['mechanical', 'civil', 'electrical', 'industrial'],
  mechanical: ['engineering', 'manufacturing', 'maintenance'],
  electrical: ['engineering', 'electronics', 'power'],
  civil: ['engineering', 'construction', 'architecture'],

  // Trades & Services
  trades: ['plumbing', 'carpentry', 'welding', 'painting', 'electrician', 'cleaning', 'maintenance'],
  plumbing: ['trades', 'maintenance', 'construction', 'piping'],
  carpentry: ['trades', 'construction', 'woodwork', 'furniture'],
  welding: ['trades', 'manufacturing', 'metal', 'construction'],
  painting: ['trades', 'construction', 'finishing', 'decoration'],
  electrician: ['trades', 'electrical', 'maintenance', 'wiring'],

  // Healthcare
  healthcare: ['medical', 'nursing', 'pharmacy', 'dental'],
  medical: ['healthcare', 'doctor', 'hospital'],
  nursing: ['healthcare', 'medical', 'patient'],
  pharmacy: ['healthcare', 'medical', 'chemistry'],

  // Education
  education: ['teaching', 'training', 'academic', 'tutoring'],
  teaching: ['education', 'academic', 'school'],

  // Food & Hospitality
  hospitality: ['hotel', 'restaurant', 'tourism', 'food'],
  cooking: ['food', 'restaurant', 'hospitality', 'chef'],

  // Driving & Transport
  driving: ['transport', 'delivery', 'logistics'],
  logistics: ['transport', 'warehouse', 'supply', 'delivery'],
};

// ─── Arabic → English Query Map ──────────────────────────────
const QUERY_MAP: Record<string, string> = {
  // Programming
  'برمجة': 'programming', 'مبرمج': 'programming', 'مطور': 'programming',
  'تطوير': 'programming', 'كودنج': 'programming', 'كود': 'programming',
  'developer': 'programming', 'programmer': 'programming', 'coding': 'programming',
  'software': 'programming', 'engineer': 'programming',
  'فرونت اند': 'frontend', 'فرونت': 'frontend', 'واجهة': 'frontend', 'frontend': 'frontend',
  'باك اند': 'backend', 'backend': 'backend', 'سيرفر': 'backend', 'server': 'backend',
  'فل ستاك': 'fullstack', 'fullstack': 'fullstack', 'full stack': 'fullstack',
  'موبايل': 'mobile', 'تطبيقات': 'mobile', 'mobile': 'mobile', 'app': 'mobile',
  'ويب': 'web', 'web': 'web', 'مواقع': 'web',

  // Design
  'تصميم': 'design', 'مصمم': 'design', 'designer': 'design', 'design': 'design',
  'جرافيك': 'graphic', 'graphic': 'graphic', 'فوتوشوب': 'graphic', 'photoshop': 'graphic',
  'ui': 'ui', 'ux': 'ux', 'تجربة مستخدم': 'ux', 'واجهات': 'ui',

  // Marketing
  'تسويق': 'marketing', 'ماركتنج': 'marketing', 'marketing': 'marketing',
  'سوشيال ميديا': 'marketing', 'social media': 'marketing',
  'اعلانات': 'marketing', 'advertising': 'marketing',
  'سيو': 'seo', 'seo': 'seo',
  'محتوى': 'content', 'كتابة': 'content', 'content': 'content', 'writing': 'content',
  'كاتب': 'content', 'writer': 'content',

  // Business
  'ادارة': 'management', 'مدير': 'management', 'management': 'management', 'manager': 'management',
  'محاسبة': 'accounting', 'محاسب': 'accounting', 'accounting': 'accounting', 'accountant': 'accounting',
  'مالية': 'finance', 'finance': 'finance', 'بنوك': 'finance', 'banking': 'finance',
  'مبيعات': 'sales', 'sales': 'sales', 'بيع': 'sales',
  'موارد بشرية': 'hr', 'hr': 'hr', 'توظيف': 'hr', 'recruitment': 'hr',

  // Engineering
  'هندسة': 'engineering', 'مهندس': 'engineering', 'engineering': 'engineering',
  'ميكانيكا': 'mechanical', 'ميكانيكي': 'mechanical', 'mechanical': 'mechanical',
  'كهرباء': 'electrical', 'كهربائي': 'electrician', 'electrical': 'electrical',
  'مدني': 'civil', 'بناء': 'civil', 'civil': 'civil', 'construction': 'civil',

  // Trades
  'حرفي': 'trades', 'حرفيين': 'trades', 'صنايعي': 'trades', 'صنيعي': 'trades', 'خدمات': 'trades',
  'craftsman': 'trades', 'tradesman': 'trades', 'trades': 'trades', 'handyman': 'trades',
  'فني': 'trades', 'تقني': 'trades', 'technician': 'trades',
  'سباكة': 'plumbing', 'سباك': 'plumbing', 'plumber': 'plumbing', 'plumbing': 'plumbing',
  'نجارة': 'carpentry', 'نجار': 'carpentry', 'carpenter': 'carpentry', 'carpentry': 'carpentry',
  'لحام': 'welding', 'welding': 'welding', 'welder': 'welding',
  'دهان': 'painting', 'نقاش': 'painting', 'painter': 'painting', 'painting': 'painting',
  'كهربجي': 'electrician', 'فني كهرباء': 'electrician', 'electrician': 'electrician',

  // Healthcare
  'طبيب': 'medical', 'دكتور': 'medical', 'doctor': 'medical', 'طب': 'medical',
  'تمريض': 'nursing', 'ممرض': 'nursing', 'ممرضة': 'nursing', 'nurse': 'nursing', 'nursing': 'nursing',
  'صيدلة': 'pharmacy', 'صيدلي': 'pharmacy', 'pharmacist': 'pharmacy', 'pharmacy': 'pharmacy',
  'صحة': 'healthcare', 'health': 'healthcare', 'healthcare': 'healthcare',

  // Education
  'تعليم': 'education', 'مدرس': 'teaching', 'معلم': 'teaching', 'teacher': 'teaching',
  'تدريس': 'teaching', 'teaching': 'teaching', 'education': 'education',
  'تدريب': 'education', 'training': 'education', 'trainer': 'education',

  // Food & Hospitality
  'طبخ': 'cooking', 'طباخ': 'cooking', 'شيف': 'cooking', 'chef': 'cooking', 'cook': 'cooking',
  'مطعم': 'hospitality', 'فندق': 'hospitality', 'hotel': 'hospitality', 'restaurant': 'hospitality',

  // Driving & Transport
  'سواقة': 'driving', 'سائق': 'driving', 'driver': 'driving', 'driving': 'driving',
  'توصيل': 'driving', 'delivery': 'logistics',
  'مخزن': 'logistics', 'warehouse': 'logistics', 'logistics': 'logistics',
};

// ─── Title → Tags Auto-Detection Rules ──────────────────────
const TITLE_TAG_RULES: Array<{ keywords: string[]; tags: string[] }> = [
  // Programming
  { keywords: ['software engineer', 'software developer', 'مهندس برمجيات'], tags: ['programming', 'software', 'engineering'] },
  { keywords: ['frontend', 'front-end', 'front end', 'فرونت اند', 'react', 'angular', 'vue'], tags: ['frontend', 'web', 'programming', 'ui'] },
  { keywords: ['backend', 'back-end', 'back end', 'باك اند', 'node', 'django', 'spring', 'laravel', 'express'], tags: ['backend', 'web', 'programming', 'api'] },
  { keywords: ['full stack', 'fullstack', 'فل ستاك'], tags: ['fullstack', 'frontend', 'backend', 'web', 'programming'] },
  { keywords: ['mobile', 'ios', 'android', 'flutter', 'react native', 'موبايل', 'تطبيقات'], tags: ['mobile', 'programming', 'app'] },
  { keywords: ['devops', 'sre', 'cloud', 'aws', 'azure', 'docker', 'kubernetes'], tags: ['devops', 'cloud', 'programming', 'infrastructure'] },
  { keywords: ['data scientist', 'machine learning', 'ai', 'ml', 'ذكاء اصطناعي', 'بيانات'], tags: ['programming', 'data', 'ai'] },
  { keywords: ['developer', 'مطور', 'مبرمج', 'programmer', 'coder'], tags: ['programming', 'software'] },
  { keywords: ['qa', 'tester', 'testing', 'اختبار', 'جودة'], tags: ['programming', 'testing', 'qa'] },
  { keywords: ['database', 'dba', 'sql', 'قواعد بيانات'], tags: ['programming', 'database', 'backend'] },

  // Design
  { keywords: ['graphic design', 'تصميم جرافيك', 'مصمم جرافيك', 'graphic designer'], tags: ['design', 'graphic', 'creative', 'visual'] },
  { keywords: ['ui designer', 'ui/ux', 'ux designer', 'ui ux', 'مصمم واجهات'], tags: ['design', 'ui', 'ux', 'frontend'] },
  { keywords: ['designer', 'مصمم', 'تصميم'], tags: ['design', 'creative'] },

  // Marketing
  { keywords: ['marketing', 'تسويق', 'ماركتنج'], tags: ['marketing', 'digital', 'business'] },
  { keywords: ['social media', 'سوشيال', 'سوشيال ميديا'], tags: ['marketing', 'social', 'content'] },
  { keywords: ['seo', 'سيو'], tags: ['marketing', 'seo', 'digital', 'web'] },
  { keywords: ['content', 'محتوى', 'كاتب', 'writer', 'copywriter'], tags: ['content', 'marketing', 'writing', 'creative'] },

  // Business
  { keywords: ['accountant', 'محاسب', 'محاسبة', 'accounting'], tags: ['accounting', 'finance', 'business'] },
  { keywords: ['finance', 'مالية', 'مالي'], tags: ['finance', 'business', 'accounting'] },
  { keywords: ['sales', 'مبيعات', 'بيع', 'مندوب'], tags: ['sales', 'marketing', 'business', 'customer'] },
  { keywords: ['manager', 'مدير', 'ادارة', 'management'], tags: ['management', 'leadership', 'business'] },
  { keywords: ['hr', 'موارد بشرية', 'human resources', 'توظيف'], tags: ['hr', 'management', 'recruitment'] },
  { keywords: ['secretary', 'سكرتير', 'سكرتيرة', 'admin', 'اداري'], tags: ['management', 'admin', 'office'] },

  // Engineering
  { keywords: ['mechanical', 'ميكانيكي', 'ميكانيكا'], tags: ['mechanical', 'engineering', 'maintenance'] },
  { keywords: ['electrical engineer', 'مهندس كهرباء'], tags: ['electrical', 'engineering'] },
  { keywords: ['civil', 'مدني', 'إنشائي', 'construction'], tags: ['civil', 'engineering', 'construction'] },
  { keywords: ['architect', 'معماري', 'عمارة'], tags: ['civil', 'engineering', 'architecture', 'design'] },

  // Trades
  { keywords: ['plumber', 'سباك', 'سباكة'], tags: ['plumbing', 'trades', 'maintenance', 'construction'] },
  { keywords: ['carpenter', 'نجار', 'نجارة'], tags: ['carpentry', 'trades', 'construction', 'woodwork'] },
  { keywords: ['welder', 'لحام'], tags: ['welding', 'trades', 'manufacturing', 'metal'] },
  { keywords: ['painter', 'دهان', 'نقاش'], tags: ['painting', 'trades', 'construction', 'finishing'] },
  { keywords: ['electrician', 'كهربائي', 'فني كهرباء', 'كهربجي'], tags: ['electrician', 'trades', 'electrical', 'maintenance'] },
  { keywords: ['technician', 'فني', 'تقني'], tags: ['trades', 'maintenance', 'technical'] },

  // Healthcare
  { keywords: ['doctor', 'طبيب', 'دكتور'], tags: ['medical', 'healthcare'] },
  { keywords: ['nurse', 'ممرض', 'ممرضة', 'تمريض'], tags: ['nursing', 'healthcare', 'medical'] },
  { keywords: ['pharmacist', 'صيدلي', 'صيدلة'], tags: ['pharmacy', 'healthcare', 'medical'] },
  { keywords: ['dentist', 'طبيب اسنان', 'اسنان'], tags: ['healthcare', 'medical', 'dental'] },

  // Education
  { keywords: ['teacher', 'مدرس', 'معلم', 'تدريس'], tags: ['teaching', 'education', 'academic'] },
  { keywords: ['trainer', 'مدرب', 'تدريب'], tags: ['education', 'training'] },
  { keywords: ['tutor', 'مدرس خصوصي'], tags: ['teaching', 'education', 'tutoring'] },

  // Food
  { keywords: ['chef', 'شيف', 'طباخ', 'طبخ', 'cook'], tags: ['cooking', 'food', 'hospitality'] },
  { keywords: ['waiter', 'garson', 'جرسون', 'نادل'], tags: ['hospitality', 'restaurant', 'food'] },

  // Driving
  { keywords: ['driver', 'سائق', 'سواق'], tags: ['driving', 'transport'] },
  { keywords: ['delivery', 'توصيل', 'مندوب توصيل'], tags: ['driving', 'logistics', 'delivery'] },

  // Cleaning
  { keywords: ['cleaner', 'نظافة', 'عامل نظافة', 'تنظيف'], tags: ['cleaning', 'maintenance', 'trades'] },

  // Security
  { keywords: ['security', 'أمن', 'حارس', 'guard'], tags: ['security', 'safety'] },

  // Customer Service
  { keywords: ['customer service', 'خدمة عملاء', 'support', 'دعم فني'], tags: ['customer', 'support', 'service'] },
  { keywords: ['call center', 'كول سنتر'], tags: ['customer', 'support', 'service'] },
];

@Injectable()
export class AiSmartService {
  constructor(
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
  ) {}

  // ─── 1. Normalize Text ─────────────────────────────────────
  normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ─── 1.5 Strip Arabic Prefixes ─────────────────────────────
  // Removes "ال" (the), common prefixes, and normalizes Arabic letter forms
  stripArabic(word: string): string[] {
    const variants: string[] = [word];

    // Strip "ال" (the) from beginning
    if (word.startsWith('ال')) {
      variants.push(word.slice(2));
    }

    // Strip "بال" (with the), "وال" (and the), "لل" (for the)
    if (word.startsWith('بال') || word.startsWith('وال')) {
      variants.push(word.slice(3));
    }
    if (word.startsWith('لل')) {
      variants.push(word.slice(2));
    }

    // Strip trailing "ة" (taa marbuta) → "ه" equivalence
    const withoutTaa = variants.map(v => {
      if (v.endsWith('ة')) return v.slice(0, -1);
      return v;
    });
    variants.push(...withoutTaa);

    // Strip trailing "ين" "ون" "ات" (plural forms)
    const withoutPlural = variants.map(v => {
      if (v.endsWith('ين') || v.endsWith('ون') || v.endsWith('ات')) return v.slice(0, -2);
      return v;
    });
    variants.push(...withoutPlural);

    return [...new Set(variants.filter(v => v.length > 1))];
  }

  // ─── 2. Auto-Tag a Job by Title + Description ──────────────
  autoTagJob(title: string, description?: string): string[] {
    const combined = this.normalize(`${title} ${description || ''}`);
    const tagSet = new Set<string>();

    for (const rule of TITLE_TAG_RULES) {
      for (const keyword of rule.keywords) {
        if (combined.includes(this.normalize(keyword))) {
          rule.tags.forEach(tag => tagSet.add(tag));
        }
      }
    }

    // Expand tags: if a tag has related tags in ROLE_TAG_RULES, add them
    const expanded = new Set<string>(tagSet);
    for (const tag of tagSet) {
      if (ROLE_TAG_RULES[tag]) {
        ROLE_TAG_RULES[tag].forEach(t => expanded.add(t));
      }
    }

    return Array.from(expanded);
  }

  // ─── 3. Expand Query to Tags ───────────────────────────────
  expandQuery(query: string): string[] {
    const normalized = this.normalize(query);
    const tags = new Set<string>();

    // Direct map match (full query)
    if (QUERY_MAP[normalized]) {
      tags.add(QUERY_MAP[normalized]);
    }

    // Try each word individually + try stripped Arabic variants
    const words = normalized.split(' ');
    // Skip stop words (Arabic prepositions and articles)
    const stopWords = new Set(['في', 'من', 'على', 'إلى', 'عن', 'مع', 'هو', 'هي', 'أنا', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'كل', 'بعض', 'أو', 'و', 'ثم', 'لكن', 'عند', 'بين', 'حول', 'مطلوب', 'متخصص', 'خبرة', 'يبحث', 'ابحث', 'عن', 'شغل', 'عمل', 'وظيفة', 'وظائف']);

    for (const word of words) {
      if (stopWords.has(word) || word.length <= 1) continue;

      // Try the word directly
      if (QUERY_MAP[word]) {
        tags.add(QUERY_MAP[word]);
        continue;
      }

      // Try Arabic stripped variants
      const variants = this.stripArabic(word);
      for (const variant of variants) {
        if (QUERY_MAP[variant]) {
          tags.add(QUERY_MAP[variant]);
          break;
        }
      }
    }

    // If nothing found, use the query words as tags
    if (tags.size === 0) {
      tags.add(normalized);
    }

    // Expand each tag: add related tags
    const expanded = new Set<string>(tags);
    for (const tag of tags) {
      if (ROLE_TAG_RULES[tag]) {
        ROLE_TAG_RULES[tag].forEach(t => expanded.add(t));
      }
    }

    return Array.from(expanded);
  }


  // ─── 4. Smart Search with Scoring ──────────────────────────
  async smartSearch(query: string, filters?: { 
    location?: string; 
    jobType?: string; 
    categoryId?: string;
    classification?: string;
    excludeClassification?: string;
  }): Promise<{
    data: any[];
    query: string;
    expandedTags: string[];
    total: number;
  }> {
    const normalizedQuery = this.normalize(query);
    const expandedTags = this.expandQuery(query);

    // Fetch all active jobs with application counts
    const qb = this.jobRepo.createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoin('job.applications', 'applications')
      .addSelect(['applications.applicationId'])
      .where('job.isActive = :isActive', { isActive: true });

    // Apply strict classification filters at query level
    if (filters?.classification) {
      qb.andWhere('job.classification = :classification', { classification: filters.classification });
    }
    if (filters?.excludeClassification) {
      qb.andWhere('job.classification != :excludeCls', { excludeCls: filters.excludeClassification });
    }

    const allJobs = await qb.orderBy('job.createdAt', 'DESC').getMany();

    // Score each job
    const scored = allJobs.map(job => {
      const jobTags = this.autoTagJob(job.title, job.description);
      const normalizedTitle = this.normalize(job.title);
      const normalizedDesc = this.normalize(job.description || '');
      let score = 0;

      // +5 → Exact title match
      if (normalizedTitle.includes(normalizedQuery)) {
        score += 5;
      }

      // +3 → Tag match (per matched tag)
      let matchedTags = 0;
      for (const tag of expandedTags) {
        if (jobTags.includes(tag)) {
          matchedTags++;
          score += 3;
        }
      }

      // +2 → Partial match in title or description
      const queryWords = normalizedQuery.split(' ');
      for (const word of queryWords) {
        if (word.length > 1 && (normalizedTitle.includes(word) || normalizedDesc.includes(word))) {
          score += 2;
        }
      }

      // Apply additional filters
      if (filters?.location && job.address) {
        if (!this.normalize(job.address).includes(this.normalize(filters.location))) {
          return null; // filter out
        }
      }
      if (filters?.jobType && job.jobType !== filters.jobType) {
        return null;
      }
      if (filters?.categoryId && job.categoryId !== parseInt(filters.categoryId)) {
        return null;
      }

      return { 
        ...job, 
        appliedCount: Array.isArray(job.applications) ? job.applications.length : 0,
        _score: score, 
        _matchedTags: matchedTags, 
        _roleTags: jobTags 
      };
    }).filter((j): j is NonNullable<typeof j> => j !== null && j._score > 0);

    // Sort by score descending
    scored.sort((a, b) => b!._score - a!._score);

    // Clean circular refs
    scored.forEach((job: any) => {
      if (job.company?.jobs) delete job.company.jobs;
    });

    return {
      data: scored,
      query: normalizedQuery,
      expandedTags,
      total: scored.length,
    };
  }

  // ─── 5. CV Match Score ─────────────────────────────────────
  scoreCvMatch(
    userSkills: string[],
    userBio: string,
    jobTitle: string,
    jobDescription: string,
  ): {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    tips: string[];
  } {
    const jobTags = this.autoTagJob(jobTitle, jobDescription);
    const jobText = this.normalize(`${jobTitle} ${jobDescription}`);

    // Extract keywords from job description
    const jobKeywords = new Set<string>();
    for (const rule of TITLE_TAG_RULES) {
      for (const keyword of rule.keywords) {
        if (jobText.includes(this.normalize(keyword))) {
          jobKeywords.add(this.normalize(keyword));
        }
      }
    }

    // Normalize user skills
    const normalizedUserSkills = (userSkills || []).map(s => this.normalize(s));
    const userText = this.normalize(`${normalizedUserSkills.join(' ')} ${userBio || ''}`);

    const matched: string[] = [];
    const missing: string[] = [];

    // Compare tags
    for (const tag of jobTags) {
      if (userText.includes(tag) || normalizedUserSkills.some(s => s.includes(tag))) {
        matched.push(tag);
      } else {
        missing.push(tag);
      }
    }

    const score = jobTags.length > 0
      ? Math.round((matched.length / jobTags.length) * 100)
      : 0;

    const tips: string[] = [];
    if (score < 30) tips.push('ننصحك بتطوير مهاراتك في المجالات المطلوبة ⬇️');
    if (score >= 30 && score < 70) tips.push('لديك أساس جيد، حاول اكتساب المهارات الناقصة 💪');
    if (score >= 70) tips.push('ملفك متوافق بشكل ممتاز! قدّم الآن 🎯');
    if (missing.length > 0) tips.push(`المهارات الناقصة: ${missing.slice(0, 5).join(', ')}`);

    return { score, matchedSkills: matched, missingSkills: missing, tips };
  }

  // ─── 6. Generate Job Description from Template ─────────────
  generateJobDescription(input: {
    title: string;
    category?: string;
    experience?: string;
    location?: string;
  }): string {
    const title = input.title || 'موظف';
    const category = input.category || '';
    const experience = input.experience || 'غير محدد';
    const location = input.location || 'غير محدد';

    const tags = this.autoTagJob(title, category);
    const isArabic = /[\u0600-\u06FF]/.test(title);

    if (isArabic) {
      return [
        `# مطلوب ${title}`,
        '',
        `## عن الوظيفة`,
        `نبحث عن ${title} متميز/ة للانضمام لفريقنا. الخبرة المطلوبة: ${experience}.`,
        location !== 'غير محدد' ? `📍 الموقع: ${location}` : '',
        '',
        `## المهام والمسؤوليات`,
        `- تنفيذ المهام المتعلقة بمجال ${tags.slice(0, 3).join(' و ')}`,
        `- العمل ضمن فريق والتنسيق مع الأقسام الأخرى`,
        `- الحفاظ على جودة العمل والالتزام بالمواعيد`,
        `- تقديم أفكار إبداعية لتطوير الأداء`,
        '',
        `## المؤهلات المطلوبة`,
        `- خبرة ${experience} في مجال مشابه`,
        `- مهارات قوية في ${tags.slice(0, 4).join(', ')}`,
        `- القدرة على العمل تحت الضغط`,
        `- مهارات تواصل ممتازة`,
        '',
        `## المزايا`,
        `- بيئة عمل احترافية ومحفزة`,
        `- فرص للنمو والتطور المهني`,
        `- راتب تنافسي ومكافآت`,
      ].filter(l => l !== '').join('\n');
    }

    return [
      `# ${title} Needed`,
      '',
      `## About the Role`,
      `We are looking for a talented ${title} to join our team. Required experience: ${experience}.`,
      location !== 'غير محدد' ? `📍 Location: ${location}` : '',
      '',
      `## Key Responsibilities`,
      `- Handle tasks related to ${tags.slice(0, 3).join(', ')}`,
      `- Collaborate with cross-functional teams`,
      `- Maintain high-quality standards and meet deadlines`,
      `- Contribute creative ideas to improve performance`,
      '',
      `## Requirements`,
      `- ${experience} of relevant experience`,
      `- Strong skills in ${tags.slice(0, 4).join(', ')}`,
      `- Ability to work under pressure`,
      `- Excellent communication skills`,
      '',
      `## Benefits`,
      `- Professional and motivating work environment`,
      `- Career growth opportunities`,
      `- Competitive salary and bonuses`,
    ].filter(l => l !== '').join('\n');
  }

  // ─── 7. Generate Cover Letter ──────────────────────────────
  generateCoverLetter(input: {
    userName: string;
    userSkills: string[];
    userExperience?: number;
    jobTitle: string;
    companyName?: string;
  }): string {
    const { userName, userSkills, userExperience, jobTitle, companyName } = input;
    const skills = (userSkills || []).slice(0, 5).join('، ');
    const company = companyName || 'شركتكم الكريمة';
    const exp = userExperience || 0;
    const isArabic = /[\u0600-\u06FF]/.test(jobTitle);

    if (isArabic) {
      return [
        `السيد/السيدة مدير التوظيف المحترم/ة`,
        `${company}`,
        '',
        `تحية طيبة وبعد،`,
        '',
        `أتقدم إليكم بطلبي لشغل وظيفة **${jobTitle}** المعلنة لديكم. أنا ${userName}، ` +
        `لدي خبرة ${exp > 0 ? exp + ' سنوات' : 'واعدة'} في هذا المجال.`,
        '',
        `أتمتع بمهارات قوية في: ${skills || 'مجالات متعددة'}، ` +
        `وأؤمن بأن هذه المهارات ستمكنني من المساهمة بشكل فعّال في فريق عمل ${company}.`,
        '',
        `أتطلع لفرصة مناقشة كيف يمكنني أن أضيف قيمة حقيقية لفريقكم.`,
        '',
        `مع خالص التقدير،`,
        `**${userName}**`,
      ].join('\n');
    }

    return [
      `Dear Hiring Manager,`,
      `${company}`,
      '',
      `I am writing to express my interest in the **${jobTitle}** position at your company. ` +
      `My name is ${userName}, and I have ${exp > 0 ? exp + ' years of' : 'enthusiasm and'} experience in this field.`,
      '',
      `I have strong skills in: ${skills || 'various areas'}, ` +
      `and I am confident that these skills will allow me to contribute effectively to the ${company} team.`,
      '',
      `I look forward to the opportunity to discuss how I can add real value to your team.`,
      '',
      `Best regards,`,
      `**${userName}**`,
    ].join('\n');
  }
}
