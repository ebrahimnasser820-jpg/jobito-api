import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
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
    await client.query(`
      TRUNCATE TABLE 
        ptj.about_stats,
        ptj.features,
        ptj.help_articles,
        ptj.help_categories,
        ptj.services,
        testimonials, 
        applications, 
        jobs, 
        companies, 
        categories,
        users
      RESTART IDENTITY CASCADE;
    `);

    // 1. Seed Categories
    console.log('Seeding categories...');
    const categories = [
      ['تصميم', 'Design', 'وظائف التصميم الجرافيكي وواجهة المستخدم', 'Graphic and UI/UX design positions'],
      ['مبيعات', 'Sales', 'وظائف المبيعات وتطوير الأعمال', 'Sales and business development roles'],
      ['تسويق', 'Marketing', 'التسويق الرقمي وإدارة المحتوى', 'Digital marketing and content management'],
      ['مالية', 'Finance', 'المحاسبة والإدارة المالية', 'Accounting and financial management'],
      ['تكنولوجيا', 'Technology', 'تطوير البرمجيات وتكنولوجيا المعلومات', 'Software development and IT roles'],
      ['هندسة', 'Engineering', 'الهندسة والأنظمة التقنية', 'Engineering and technical systems'],
      ['إدارة', 'Management', 'الإدارة وقيادة الفرق', 'Management and team leadership'],
    ];

    const categoryIds: Record<string, number> = {};
    for (const cat of categories) {
      const res = await client.query(`
        INSERT INTO categories (name, name_en, description, description_en)
        VALUES ($1, $2, $3, $4)
        RETURNING category_id;
      `, cat);
      categoryIds[cat[1]] = res.rows[0].category_id;
    }

    // 2. Seed Companies
    console.log('Seeding companies...');
    const companies = [
      {
        name: 'جوبيتو تك',
        nameEn: 'Jobito Tech',
        desc: 'شركة برمجيات رائدة في الشرق الأوسط',
        descEn: 'Leading software company in MEA',
        address: 'القاهرة، مصر',
        email: 'hr@jobito.tech',
        website: 'https://jobito.tech',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Jobito',
        benefits: JSON.stringify([{ emoji: "🏠", name: "Work from home" }])
      },
      {
        name: 'كود زون',
        nameEn: 'CodeZone',
        desc: 'مركز الابتكار التقني',
        descEn: 'Tech Innovation Hub',
        address: 'الرياض، السعودية',
        email: 'jobs@codezone.io',
        website: 'https://codezone.io',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=CodeZone',
        benefits: JSON.stringify([{ emoji: "🚀", name: "Career Growth" }])
      },
      {
        name: 'ديزاين هب',
        nameEn: 'Design Hub',
        desc: 'وكالة تصميم إبداعية',
        descEn: 'Creative Design Agency',
        address: 'دبي، الإمارات',
        email: 'hello@designhub.co',
        website: 'https://designhub.co',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=DesignHub',
        benefits: JSON.stringify([{ emoji: "🎨", name: "Creative Space" }])
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

    // 3. Seed Users
    console.log('Seeding users...');
    const passHash = await bcrypt.hash('password123', 10);
    const users = [
      ['Ahmed Admin', 'admin@jobito.com', passHash, 'admin'],
      ['Sara Manager', 'manager@jobito.tech', passHash, 'company'],
      ['Mohamed Student', 'student@gmail.com', passHash, 'student'],
    ];

    const userMap: Record<string, string> = {};
    for (const u of users) {
      const res = await client.query(`
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id;
      `, u);
      userMap[u[1]] = res.rows[0].user_id;
    }

    // 4. Seed Jobs
    console.log('Seeding jobs...');
    const jobTemplates = [
      { title: 'مطور واجهات أمامية (React)', titleEn: 'Front-end Developer (React)', category: 'Technology', type: 'part-time', sMin: 15000, sMax: 25000 },
      { title: 'مطور خلفية (Node.js)', titleEn: 'Backend Developer (Node.js)', category: 'Technology', type: 'part-time', sMin: 20000, sMax: 35000 },
      { title: 'مصمم واجهات UI/UX', titleEn: 'UI/UX Designer', category: 'Design', type: 'freelance', sMin: 12000, sMax: 18000 },
      { title: 'اختصاصي تسويق رقمي', titleEn: 'Digital Marketing Specialist', category: 'Marketing', type: 'one-time', sMin: 8000, sMax: 12000 },
    ];

    for (let i = 0; i < 10; i++) {
      const template = jobTemplates[i % jobTemplates.length];
      const companyId = companyIds[i % companyIds.length];
      const categoryId = categoryIds[template.category];
      
      await client.query(`
        INSERT INTO jobs (company_id, category_id, title, title_en, description, description_en, salary_min, salary_max, job_type, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `, [
        companyId, categoryId, template.title, template.titleEn,
        `وصف الوظيفة لـ ${template.title}`, `Job description for ${template.titleEn}`,
        template.sMin, template.sMax, template.type, 'Remote'
      ]);
    }

    // 5. Seed Testimonials
    console.log('Seeding testimonials...');
    const studentId = userMap['student@gmail.com'];
    if (studentId) {
      const testimonials = [
        [studentId, 'بفضل جوبيتو حصلت على وظيفتي الأولى في أسبوعين!', 'Thanks to Jobito, I got my first job in two weeks!', true],
        [studentId, 'أفضل منصة للعثور على وظائف بدوام جزئي في الشرق الأوسط.', 'The best platform for finding part-time jobs in the Middle East.', true],
      ];
      for (const t of testimonials) {
        await client.query(`INSERT INTO testimonials (user_id, body, body_en, is_featured) VALUES ($1, $2, $3, $4);`, t);
      }
    }

    // 6. Seed Services
    console.log('Seeding services...');
    const services = [
      ['كفاءة مكان العمل', 'Workplace Efficiency', 'نقدم تدريباً في مكان العمل على جميع مستويات العمل، مما يساعد الأفراد على الوصول إلى إمكاناتهم وتحقيق النجاح في مكان العمل.', 'We provide workplace training at all levels of work, helping individuals reach their potential and achieve workplace success.', 'trending-up'],
      ['إعادة التصميم التنظيمي', 'Organizational Redesign', 'نحن ندعم الشركات في إعادة تشكيل وإعادة مواءمة نموذج أعمالها وهيكلها للتكيف مع العالم سريع التغير الذي نعيش فيه.', 'We support companies in reshaping and realigning their business model and structure to adapt to the fast-changing world we live in.', 'layout'],
      ['خدمات تحسين المسار المهني', 'Career transition services', 'يمكن أن يكون الانتقال الوظيفي تجربة شاقة. يمكننا مساعدتك في اكتساب الثقة والعثور على إمكاناتك، والحصول على الوظيفة التي ترغب فيها.', 'Career transition can be a daunting experience. We can help you gain confidence and find your potential, and get the job you want.', 'refresh-cw'],
      ['جذب المواهب والتوظيف', 'Talent attraction and acquisition', 'فريقنا من المتخصصين مكرس للعثور لك على محترفين لديهم المهارات والمواقف الصحيحة التي ستساعد في نقل عملك إلى المستوى التالي.', 'Our team of specialists are dedicated to finding you professionals with the right skills and attitudes that will help take your business to the next level.', 'users'],
      ['دعم الموارد البشرية العام', 'General HR Support', 'نحن نقدم مجموعة من الدعم العام للموارد البشرية وإدارة الموظفين. سواء كان ذلك عبر الهاتف أو البريد الإلكتروني أو شخصياً، فلدينا المعرفة.', 'We provide a range of general HR and people management support. Whether it be via phone, email or in-person, we have the knowledge.', 'help-circle'],
      ['إدارة الأداء', 'Performance Management', 'عندما تقوم مؤسستك بإدارة الأداء بشكل صحيح، سيعمل موظفوك معاً بشكل متماسك للوصول إلى أهداف شركتك.', 'When your organization does performance management correctly, your staff will work together cohesively to reach your company goals.', 'bar-chart'],
      ['التخطيط الاستراتيجي', 'Strategic Planning', 'نساعدك على تطوير وتنفيذ مبادرات الموارد البشرية الاستراتيجية التي تتماشى مع أهداف عملك وتدفع النمو المستدام.', 'We help you develop and implement strategic HR initiatives that align with your business objectives and drive sustainable growth.', 'target'],
      ['مشاركة الموظفين', 'Employee Engagement', 'قم بإنشاء ثقافة عمل مزدهرة من خلال برامج مشاركة الموظفين لدينا المصممة لتعزيز الإنتاجية والاحتفاظ بالموظفين.', 'Create a thriving work culture with our employee engagement programs designed to boost productivity and retention.', 'heart'],
    ];
    for (const s of services) {
      await client.query(`INSERT INTO ptj.services (title, title_en, description, description_en, icon) VALUES ($1, $2, $3, $4, $5);`, s);
    }

    // 7. Seed Help Center
    console.log('Seeding help center...');
    const hCats = [
      ['البداية', 'Getting Started', 'play-circle'],
      ['ملفي الشخصي', 'My Profile', 'user'],
      ['التقدم لوظيفة', 'Applying for a Job', 'briefcase'],
      ['نصائح البحث عن وظيفة', 'Job Search Tips', 'lightbulb'],
      ['تنبيهات الوظائف', 'Job Alerts', 'bell'],
    ];
    const catIds: number[] = [];
    for (const hc of hCats) {
      const res = await client.query(`INSERT INTO ptj.help_categories (name, name_en, icon) VALUES ($1, $2, $3) RETURNING help_category_id;`, hc);
      catIds.push(res.rows[0].help_category_id);
    }

    const hArts = [
      [catIds[2], 'ما هي طلباتي؟', 'What are my applications?', 'طلباتي هي وسيلة لك لمتابعة الوظائف أثناء انتقالك عبر عملية التقديم.', 'My applications are a way for you to track jobs as you move through the application process.'],
      [catIds[2], 'كيفية الوصول إلى سجل طلباتي', 'How to access my application history', 'للوصول إلى سجل الطلبات، انتقل إلى صفحة طلباتي.', 'To access the application history, go to the My Applications page.'],
    ];
    for (const ha of hArts) {
      await client.query(`INSERT INTO ptj.help_articles (category_id, title, title_en, content, content_en) VALUES ($1, $2, $3, $4, $5);`, ha);
    }

    // 8. Seed Features (Why Us)
    console.log('Seeding features...');
    const featuresArr = [
      ['تصميم أنيق وعصري', 'Clean and modern design', 'التصاميم التي نصنعها هي تصاميم عصرية.', 'The designs we create are modern.', 'sparkles'],
      ['البيانات دائماً آمنة', 'Data is always safe', 'لقد وجدنا أخيراً مضيفاً فهم حقاً الحاجة الماسة للأمن.', 'We finally found a host that truly understood the critical need for security.', 'shield'],
      ['تحليل متطور', 'Sophisticated Analysis', 'إجراءات وبيانات آمنة.', 'Secure actions and data.', 'bar-chart-2'],
      ['دعمنا المخصص', 'Our Dedicated Support', 'لقد وجدنا أخيراً مضيفاً فهم حقاً الحاجة الماسة للأمن.', 'We finally found a host that truly understood the critical need for security.', 'headphones'],
    ];
    for (const f of featuresArr) {
      await client.query(`INSERT INTO ptj.features (title, title_en, description, description_en, icon) VALUES ($1, $2, $3, $4, $5);`, f);
    }

    // 9. Seed About Stats
    console.log('Seeding about stats...');
    const stats = [
      ['عملاء سعداء', 'Happy Clients', '2.5k+', 'smile'],
      ['جلسات مكتملة', 'Sessions Done', '10k+', 'check-circle'],
      ['معالجون خبراء', 'Expert Therapists', '50+', 'users'],
      ['سنوات خبرة', 'Years experience', '15+', 'award'],
    ];
    for (const s of stats) {
      await client.query(`INSERT INTO ptj.about_stats (label, label_en, value, icon) VALUES ($1, $2, $3, $4);`, s);
    }

    console.log('Successfully seeded EVERYTHING! 🚀🎉');
  } catch (err) {
    console.error('Error seeding everything:', err);
  } finally {
    await client.end();
  }
}

seed();
