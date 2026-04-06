const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mlpoknbv',
  database: process.env.DB_NAME || 'jobito',
});

async function seedJobs() {
  try {
    await client.connect();
    console.log('Connected to DB');

    // Get a company and a category to link to
    const resCompany = await client.query('SELECT company_id FROM ptj.companies LIMIT 1');
    const resCategory = await client.query('SELECT category_id FROM ptj.categories LIMIT 5');

    if (resCompany.rows.length === 0) {
      console.log('No companies found. Please seed companies first.');
      return;
    }

    const companyId = resCompany.rows[0].company_id;
    const categories = resCategory.rows;

    const mockJobs = [
      {
        title: 'مطور واجهات أمامية (React)',
        titleEn: 'Frontend Developer (React)',
        description: 'نبحث عن مطور محترف في ريأكت لتطوير واجهات المستخدم.',
        descriptionEn: 'Looking for a professional React developer for UI development.',
        salary: 1500,
        job_type: 'full-time',
        address: 'الإسكندرية، مصر',
        categoryId: categories[0]?.category_id || 1,
      },
      {
        title: 'مدير تسويق رقمي',
        titleEn: 'Digital Marketing Manager',
        description: 'إدارة حملات التسويق وتحسين محركات البحث.',
        descriptionEn: 'Managing marketing campaigns and SEO optimization.',
        salary: 1200,
        job_type: 'full-time',
        address: 'القاهرة، مصر',
        categoryId: categories[1]?.category_id || 2,
      },
      {
        title: 'مصمم جرافيك',
        titleEn: 'Graphic Designer',
        description: 'تصميم الهويات البصرية والمنشورات.',
        descriptionEn: 'Designing visual identities and posts.',
        salary: 800,
        job_type: 'remote',
        address: 'عن بعد',
        categoryId: categories[2]?.category_id || 3,
      }
    ];

    for (const job of mockJobs) {
      await client.query(`
        INSERT INTO ptj.jobs (title, "titleEn", description, "descriptionEn", salary, job_type, address, company_id, category_id, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())
      `, [job.title, job.titleEn, job.description, job.descriptionEn, job.salary, job.job_type, job.address, companyId, job.categoryId]);
      console.log(`Job seeded: ${job.title}`);
    }

    console.log('Jobs seeded successfully');

  } catch (err) {
    console.error('Error seeding jobs:', err);
  } finally {
    await client.end();
  }
}

seedJobs();
