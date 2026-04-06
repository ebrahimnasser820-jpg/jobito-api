const { Client } = require('pg');
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

    // Get a category ID
    let categoryRes = await client.query(`SELECT category_id FROM categories LIMIT 1`);
    if (categoryRes.rows.length === 0) {
      const insertedCat = await client.query(`
        INSERT INTO categories (name, description) VALUES ('Marketing', 'Marketing Roles') RETURNING category_id
      `);
      categoryRes = { rows: insertedCat.rows };
    }
    const categoryId = categoryRes.rows[0].category_id;

    // Get all companies to seed jobs for them (or we can just seed for the latest one)
    const companiesRes = await client.query(`SELECT company_id FROM companies`);
    if (companiesRes.rows.length === 0) {
      console.log('No companies found. Please create a company first.');
      return;
    }

    const ALL_JOBS = [
      {
        title: "Social Media Assistant",
        is_active: true,
        job_type: "part-time",
        slots: 11,
        salary: 1500,
      },
      {
        title: "Senior Designer",
        is_active: true,
        job_type: "part-time",
        slots: 20,
        salary: 3000,
      },
      {
        title: "Visual Designer",
        is_active: true,
        job_type: "freelance",
        slots: 5,
        salary: 2250,
      },
      {
        title: "Data Science",
        is_active: false,
        job_type: "freelance",
        slots: 10,
        salary: 5000,
      },
      {
        title: "Kotlin Developer",
        is_active: false,
        job_type: "part-time",
        slots: 20,
        salary: 4000,
      },
      {
        title: "React Developer",
        is_active: false,
        job_type: "part-time",
        slots: 10,
        salary: 3500,
      },
      {
        title: "Kotlin Developer 2",
        is_active: false,
        job_type: "part-time",
        slots: 20,
        salary: 4000,
      },
    ];

    for (const company of companiesRes.rows) {
      console.log(`Seeding jobs for company ID: ${company.company_id}`);
      for (const job of ALL_JOBS) {
        // Only insert if it doesn't already exist for this company
        const countRes = await client.query(`SELECT COUNT(*) FROM ptj.jobs WHERE company_id = $1 AND title = $2`, [company.company_id, job.title]);
        if (parseInt(countRes.rows[0].count) === 0) {
           await client.query(`
             INSERT INTO ptj.jobs (title, description, salary, address, job_type, slots_available, company_id, category_id, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           `, [
             job.title, 
             `This is a mock description for ${job.title}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`, 
             job.salary,
             'New York, USA', 
             job.job_type, 
             job.slots, 
             company.company_id, 
             categoryId, 
             job.is_active
           ]);
        }
      }
    }

    console.log('Successfully seeded mock jobs for all companies! 🎉');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await client.end();
  }
}

seed();
