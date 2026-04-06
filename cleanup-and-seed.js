
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'mlpoknbv',
  database: 'jobito',
});

async function run() {
  try {
    console.log('--- DB MAINTENANCE START ---');
    await client.connect();
    console.log('CONNECTED TO DB');
    
    await client.query('SET search_path TO ptj, public;');
    console.log('SCHEMA SET TO ptj');

    // 1. Delete companies 1, 2, 3
    console.log('Deleting companies with IDs 1, 2, 3...');
    const delRes = await client.query('DELETE FROM companies WHERE company_id IN (1, 2, 3);');
    console.log(`Deleted ${delRes.rowCount} companies.`);

    // 2. Seed categories
    console.log('Seeding categories...');
    const categories = [
      ['تكنولوجيا', 'Technology', 'وظائف تطوير البرمجيات وتكنولوجيا المعلومات', 'Software development and IT roles'],
      ['تصميم', 'Design', 'وظائف التصميم الجرافيكي وواجهة المستخدم', 'Graphic and UI/UX design positions'],
      ['تسويق', 'Marketing', 'التسويق الرقمي وإدارة المحتوى', 'Digital marketing and content management'],
      ['مبيعات', 'Sales', 'وظائف المبيعات وتطوير الأعمال', 'Sales and business development roles'],
      ['مالية', 'Finance', 'المحاسبة والإدارة المالية', 'Accounting and financial management'],
      ['هندسة', 'Engineering', 'الهندسة والأنظمة التقنية', 'Engineering and technical systems'],
      ['إدارة', 'Management', 'الإدارة وقيادة الفرق', 'Management and team leadership']
    ];

    for (const [name, nameEn, desc, descEn] of categories) {
      await client.query(
        'INSERT INTO categories (name, name_en, description, description_en) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING;',
        [name, nameEn, desc, descEn]
      );
      console.log(`Seeded category: ${name}`);
    }

    const catCount = await client.query('SELECT COUNT(*) FROM categories;');
    console.log(`Total categories now: ${catCount.rows[0].count}`);
    
    console.log('--- DB MAINTENANCE END ---');
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await client.end();
  }
}

run();
