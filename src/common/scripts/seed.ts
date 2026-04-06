const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'jobito',
});

async function seed() {
  try {
    await client.connect();
    console.log('Connected to database successfully.');
    await client.query('SET search_path TO ptj, public;');

    // 0. Cleanup
    console.log('Cleaning up old data...');
    await client.query('TRUNCATE TABLE testimonials, applications, jobs, companies, categories, help_articles, help_categories, services RESTART IDENTITY CASCADE;');

    // 1. Seed Categories
    console.log('Seeding categories...');
    const categories = [
      { name: 'تصميم', nameEn: 'Design', desc: 'وظائف التصميم والابتكار', descEn: 'Graphic and UI/UX design positions' },
      { name: 'مبيعات', nameEn: 'Sales', desc: 'وظائف المبيعات والتطوير', descEn: 'Growth and revenue generation roles' },
      { name: 'تسويق', nameEn: 'Marketing', desc: 'التسويق الإلكتروني والتقليدي', descEn: 'Brand and awareness strategies' },
      { name: 'مالية', nameEn: 'Finance', desc: 'المحاسبة والإدارة المالية', descEn: 'Financial planning and auditing' },
      { name: 'تكنولوجيا', nameEn: 'Technology', desc: 'وظائف البرمجة وتكنولوجيا المعلومات', descEn: 'Coding, devops and infrastructure' },
      { name: 'هندسة', nameEn: 'Engineering', desc: 'الهندسة والأنظمة الفيزيائية', descEn: 'Physical systems and robotics' },
    ];

    const categoryIds = {};
    for (const cat of categories) {
      const res = await client.query(`
        INSERT INTO categories (name, name_en, description, description_en)
        VALUES ($1, $2, $3, $4)
        RETURNING category_id;
      `, [cat.name, cat.nameEn, cat.desc, cat.descEn]);
      categoryIds[cat.nameEn] = res.rows[0].category_id;
    }

    // 2. Seed Companies
    console.log('Seeding companies...');
    const companies = [
      {
        name: 'جوبيتو تك',
        nameEn: 'Jobito Tech',
        desc: 'شركة برمجيات رائدة في الشرق الأوسط متخصصين في حلول الويب.',
        descEn: 'A leading software company in the Middle East specialized in enterprise web solutions.',
        address: 'التجمع الخامس، القاهرة',
        email: 'hr@jobito.tech',
        website: 'https://jobito.tech',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Jobito',
        benefits: JSON.stringify([
          { emoji: '🏠', name: 'العمل عن بعد', desc: 'نموذج عمل هجين' },
          { emoji: '🏥', name: 'تأمين طبي', desc: 'تغطية كاملة للموظف وعائلته' }
        ])
      },
      {
        name: 'كود زون',
        nameEn: 'CodeZone',
        desc: 'نحن نبني المستقبل بأحدث التقنيات والحلول الذكية.',
        descEn: 'We build the future using cutting edge technology and smart innovations.',
        address: 'المنطقة الحرة، مدينة نصر، القاهرة',
        email: 'jobs@codezone.io',
        website: 'https://codezone.io',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=CodeZone',
        benefits: JSON.stringify([
          { emoji: '🍕', name: 'وجبات خفيفة', desc: 'فواكه ووجبات خفيفة يومياً' },
          { emoji: '🚀', name: 'تطور وظيفي', desc: 'مسار سريع للترقيات' }
        ])
      },
      {
        name: 'ديزاين هب',
        nameEn: 'Design Hub',
        desc: 'بيت الإبداع والمصممين الموهوبين في مصر.',
        descEn: 'The home of creativity and world-class designers in Egypt.',
        address: 'وسط البلد، القاهرة',
        email: 'hello@designhub.co',
        website: 'https://designhub.co',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=DesignHub',
        benefits: JSON.stringify([
          { emoji: '🎨', name: 'مساحة إبداعية', desc: 'بيئة عمل ملهمة' },
          { emoji: '📅', name: 'ساعات عمل مرنة', desc: 'التركيز على النتائج وليس الساعات' }
        ])
      }
    ];

    const companyIds: number[] = [];
    for (const comp of companies) {
      const res = await client.query(`
        INSERT INTO companies (name, name_en, description, description_en, address, contact_email, website, logo_url, benefits)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING company_id;
      `, [comp.name, comp.nameEn, comp.desc, comp.descEn, comp.address, comp.email, comp.website, comp.logo, comp.benefits]);
      companyIds.push(res.rows[0].company_id);
    }

    // 3. Seed Jobs
    console.log('Seeding jobs...');
    const jobTemplates = [
      { title: 'مطور واجهات (React)', titleEn: 'Front-end Developer (React)', category: 'Technology', type: 'full-time', salaryMin: 8000, salaryMax: 15000 },
      { title: 'مصمم جرافيك', titleEn: 'Graphic Designer', category: 'Design', type: 'full-time', salaryMin: 6000, salaryMax: 10000 },
      { title: 'أخصائي تسويق', titleEn: 'Marketing Specialist', category: 'Marketing', type: 'part-time', salaryMin: 5000, salaryMax: 8000 },
      { title: 'مطور خلفية (Node.js)', titleEn: 'Backend Developer (Node.js)', category: 'Technology', type: 'freelance', salaryMin: 12000, salaryMax: 20000 },
      { title: 'مصمم واجهات', titleEn: 'UI/UX Designer', category: 'Design', type: 'internship', salaryMin: 2000, salaryMax: 4000 },
      { title: 'مدير مبيعات', titleEn: 'Sales Manager', category: 'Sales', type: 'full-time', salaryMin: 15000, salaryMax: 30000 },
      { title: 'مهندس برمجيات', titleEn: 'Software Engineer', category: 'Technology', type: 'full-time', salaryMin: 10000, salaryMax: 18000 },
      { title: 'مدير وسائل التواصل', titleEn: 'Social Media Manager', category: 'Marketing', type: 'freelance', salaryMin: 4000, salaryMax: 7000 },
      { title: 'مهندس نظم', titleEn: 'DevOps Engineer', category: 'Technology', type: 'full-time', salaryMin: 15000, salaryMax: 25000 },
      { title: 'فنان رقمي', titleEn: 'Digital Artist', category: 'Design', type: 'contract', salaryMin: 10000, salaryMax: 15000 },
    ];

    for (let i = 0; i < 20; i++) {
      const template = jobTemplates[i % jobTemplates.length];
      const companyId = companyIds[i % companyIds.length];
      const categoryId = categoryIds[template.category];
      
      await client.query(`
        INSERT INTO jobs (company_id, category_id, title, title_en, description, description_en, salary_min, salary_max, job_type, address, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, now() - interval '${i} days');
      `, [
        companyId, 
        categoryId, 
        template.title, 
        template.titleEn, 
        `نحن نبحث عن ${template.title} موهوب للانضمام إلى فريقنا المتنامي. يجب أن يكون لديك شغف بالابتكار والعمل الجماعي.`,
        `We are looking for a talented ${template.titleEn} to join our growing team. You should have a passion for innovation and teamwork.`,
        template.salaryMin, 
        template.salaryMax, 
        template.type,
        'القاهرة، مصر',
      ]);
    }

    // 4. Seed Users
    console.log('Seeding users...');
    const passHash = await bcrypt.hash('password123', 10);
    const users = [
      ['Ahmed Ali', 'ahmed@student.com', passHash, 'student'],
      ['Sara Mohamed', 'sara@student.com', passHash, 'student'],
      ['Admin User', 'admin@jobito.com', passHash, 'admin'],
      ['Manager One', 'manager@jobito.tech', passHash, 'company'],
    ];

    for (const u of users) {
      await client.query(`
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING;
      `, u);
    }

    // 5. Seed Testimonials
    console.log('Seeding testimonials...');
    const userResult = await client.query(`SELECT user_id FROM users WHERE role = 'student' LIMIT 2;`);
    if (userResult.rows.length >= 1) {
      const tData = [
        [userResult.rows[0].user_id, 'بفضل جوبيتو، حصلت على وظيفتي الأولى في أسبوعين فقط! المنصة سهلة جداً في الاستخدام.', 'Thanks to Jobito, I got my first job in just two weeks! The platform is very easy to use.', true],
        [userResult.rows.length > 1 ? userResult.rows[1].user_id : userResult.rows[0].user_id, 'الدعم متعدد اللغات مذهل. يمكنني بسهولة العثور على الوظائف التي تناسب مهاراتي.', 'The multi-language support is amazing. I can easily find jobs that match my skills.', true],
      ];
      for (const t of tData) {
        await client.query(`
          INSERT INTO testimonials (user_id, body, body_en, is_featured)
          VALUES ($1, $2, $3, $4);
        `, t);
      }
    }

    // 6. Seed Services
    console.log('Seeding services...');
    const services = [
      ['كفاءة مكان العمل', 'Workplace Efficiency', 'نقدم تدريباً في مكان العمل على جميع مستويات العمل، مما يساعد الأفراد على الوصول إلى إمكاناتهم وتحقيق النجاح في مكان العمل.', 'We provide workplace training at all levels of work, helping individuals reach their potential and achieve workplace success.', 'trending-up'],
      ['إعادة التصميم التنظيمي', 'Organizational Redesign', 'نحن ندعم الشركات في إعادة تشكيل وإعادة مواءمة نموذج أعمالها وهيكلها للتكيف مع العالم سريع التغير الذي نعيش فيه.', 'We support companies in reshaping and realigning their business model and structure to adapt to the fast-changing world we live in.', 'layout'],
    ];
    for (const s of services) {
      await client.query(`
        INSERT INTO services (title, title_en, description, description_en, icon)
        VALUES ($1, $2, $3, $4, $5);
      `, s);
    }

    // 7. Seed Help Center
    console.log('Seeding help center...');
    const hCats = [
      ['البداية', 'Getting Started', 'play-circle'],
      ['ملفي الشخصي', 'My Profile', 'user'],
      ['التقدم لوظيفة', 'Applying for a Job', 'briefcase'],
    ];
    const hCatIds: any[] = [];
    for (const hc of hCats) {
      const res = await client.query(`INSERT INTO help_categories (name, name_en, icon) VALUES ($1, $2, $3) RETURNING help_category_id;`, hc);
      hCatIds.push(res.rows[0].help_category_id);
    }

    const hArts = [
      [hCatIds[2], 'ما هي طلباتي؟', 'What are my applications?', 'طلباتي هي وسيلة لك لمتابعة الوظائف أثناء انتقالك عبر عملية التقديم.', 'My applications are a way for you to track jobs as you move through the application process.'],
    ];
    for (const ha of hArts) {
      await client.query(`INSERT INTO help_articles (category_id, title, title_en, content, content_en) VALUES ($1, $2, $3, $4, $5);`, ha);
    }

    console.log('Successfully seeded rich dummy data! 🚀🎉');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await client.end();
  }
}

seed();
