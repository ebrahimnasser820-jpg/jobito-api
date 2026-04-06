
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'jobito',
});

async function seedCategories() {
  try {
    await client.connect();
    await client.query('SET search_path TO ptj, public;');

    const categories = [
      ['تصميم', 'Design', 'وظائف التصميم الجرافيكي وواجهة المستخدم', 'Graphic and UI/UX design positions'],
      ['مبيعات', 'Sales', 'وظائف المبيعات وتطوير الأعمال', 'Sales and business development roles'],
      ['تسويق', 'Marketing', 'التسويق الرقمي وإدارة المحتوى', 'Digital marketing and content management'],
      ['مالية', 'Finance', 'المحاسبة والإدارة المالية', 'Accounting and financial management'],
      ['تكنولوجيا', 'Technology', 'تطوير البرمجيات وتكنولوجيا المعلومات', 'Software development and IT roles'],
      ['هندسة', 'Engineering', 'الهندسة والأنظمة التقنية', 'Engineering and technical systems'],
      ['إدارة', 'Management', 'الإدارة وقيادة الفرق', 'Management and team leadership'],
      ['خدمة العملاء', 'Customer Service', 'دعم العملاء والرد على الاستفسارات', 'Customer support and inquiries'],
      ['تعليم وتدريس', 'Education', 'التدريس والتدريب الأكاديمي', 'Academic teaching and training'],
      ['موارد بشرية', 'HR', 'إدارة الموارد البشرية والتوظيف', 'Human resources and recruitment'],
      ['طب وصحة', 'Healthcare', 'الرعاية الطبية والتمريض', 'Medical care and nursing'],
      ['فن وإبداع', 'Arts', 'الأعمال الفنية والإبداعية', 'Artistic and creative works'],
      ['قانون', 'Legal', 'الاستشارات القانونية والمحاماة', 'Legal consulting and law'],
      ['نقل وتوصيل', 'Logistics', 'خدمات الشحن والنقل اللوجستي', 'Shipping and logistics services'],
      ['سياحة وفنادق', 'Hospitality', 'خدمات الفنادق والسياحة', 'Hotel and tourism services'],
      ['كتابة وترجمة', 'Writing', 'كتابة المحتوى والترجمة', 'Content writing and translation'],
    ];

    console.log('Seeding categories...');
    for (const cat of categories) {
      await client.query(`
        INSERT INTO categories (name, name_en, description, description_en)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING;
      `, cat);
    }
    console.log('Categories seeded successfully!');
  } catch (err) {
    console.error('Error seeding categories:', err);
  } finally {
    await client.end();
  }
}

seedCategories();
