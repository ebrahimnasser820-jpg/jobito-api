
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'mlpoknbv',
  database: 'jobito',
});

async function seedCategories() {
  try {
    console.log('Starting seed...');
    await client.connect();
    console.log('Connected to DB');
    await client.query('SET search_path TO ptj, public;');

    const categories = [
      ['تصميم', 'Design', 'وظائف التصميم الجرافيكي وواجهة المستخدم', 'Graphic and UI/UX design positions'],
      ['مبيعات', 'Sales', 'وظائف المبيعات وتطوير الأعمال', 'Sales and business development roles'],
      ['تسويق', 'Marketing', 'التسويق الرقمي وإدارة المحتوى', 'Digital marketing and content management'],
      ['مالية', 'Finance', 'المحاسبة والإدارة المالية', 'Accounting and financial management'],
      ['تكنولوجيا', 'Technology', 'تطوير البرمجيات وتكنولوجيا المعلومات', 'Software development and IT roles'],
      ['هندسة', 'Engineering', 'الهندسة والأنظمة التقنية', 'Engineering and technical systems'],
      ['إدارة', 'Management', 'الإدارة وقيادة الفرق', 'Management and team leadership'],
    ];

    for (const cat of categories) {
      await client.query(`
        INSERT INTO categories (name, name_en, description, description_en)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING;
      `, cat);
      console.log('Seeded:', cat[0]);
    }
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

seedCategories();
