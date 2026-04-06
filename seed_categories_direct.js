const { Client } = require('pg');

async function seedCategories() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'mlpoknbv',
    database: process.env.DB_NAME || 'jobito',
  });

  const categories = [
    { name: 'خدمة العملاء', nameEn: 'Customer Service', description: 'دعم العملاء والرد على الاستفسارات', descriptionEn: 'Customer support and inquiries' },
    { name: 'تعليم وتدريس', nameEn: 'Education', description: 'التدريس والتدريب الأكاديمي', descriptionEn: 'Academic teaching and training' },
    { name: 'موارد بشرية', nameEn: 'HR', description: 'إدارة الموارد البشرية والتوظيف', descriptionEn: 'Human resources and recruitment' },
    { name: 'طب وصحة', nameEn: 'Healthcare', description: 'الرعاية الطبية والتنريض', descriptionEn: 'Medical care and nursing' },
    { name: 'فن وإبداع', nameEn: 'Arts', description: 'الأعمال الفنية والإبداعية', descriptionEn: 'Artistic and creative works' },
    { name: 'قانون', nameEn: 'Legal', description: 'الاستشارات القانونية والمحاماة', descriptionEn: 'Legal consulting and law' },
    { name: 'نقل وتوصيل', nameEn: 'Logistics', description: 'خدمات الشحن والنقل اللوجستي', descriptionEn: 'Shipping and logistics services' },
    { name: 'سياحة وفنادق', nameEn: 'Hospitality', description: 'خدمات الفنادق والسياحة', descriptionEn: 'Hotel and tourism services' },
    { name: 'كتابة وترجمة', nameEn: 'Writing', description: 'كتابة المحتوى والترجمة', descriptionEn: 'Content writing and translation' },
    { name: 'إدارة', nameEn: 'Management', description: 'الإدارة وقيادة الفرق', descriptionEn: 'Management and team leadership' },
    { name: 'هندسة', nameEn: 'Engineering', description: 'الهندسة والأنظمة التقنية', descriptionEn: 'Engineering and technical systems' },
    { name: 'تكنولوجيا', nameEn: 'Technology', description: 'تطوير البرمجيات وتكنولوجيا المعلومات', descriptionEn: 'Software development and IT roles' },
    { name: 'مالية', nameEn: 'Finance', description: 'المحاسبة والإدارة المالية', descriptionEn: 'Accounting and financial management' },
    { name: 'تسويق', nameEn: 'Marketing', description: 'التسويق الرقمي وإدارة المحتوى', descriptionEn: 'Digital marketing and content management' },
    { name: 'مبيعات', nameEn: 'Sales', description: 'وظائف المبيعات وتطوير الأعمال', descriptionEn: 'Sales and business development roles' },
    { name: 'تصميم', nameEn: 'Design', description: 'وظائف التصميم الجرافيكي وواجهة المستخدم', descriptionEn: 'Graphic and UI/UX design positions' }
  ];

  try {
    await client.connect();
    console.log("Connected to database.");

    // Check if schema exists, if not create it
    await client.query("CREATE SCHEMA IF NOT EXISTS ptj");
    
    // Check if table exists, if not create it
    await client.query(`
      CREATE TABLE IF NOT EXISTS ptj.categories (
        category_id BIGSERIAL PRIMARY KEY,
        name VARCHAR(150) UNIQUE NOT NULL,
        name_en VARCHAR(150),
        description TEXT,
        description_en TEXT
      )
    `);

    for (const cat of categories) {
      const res = await client.query("SELECT * FROM ptj.categories WHERE name = $1", [cat.name]);
      if (res.rowCount === 0) {
        await client.query(
          "INSERT INTO ptj.categories (name, name_en, description, description_en) VALUES ($1, $2, $3, $4)",
          [cat.name, cat.nameEn, cat.description, cat.descriptionEn]
        );
        console.log(`Inserted: ${cat.name}`);
      } else {
        await client.query(
          "UPDATE ptj.categories SET name_en = $1, description = $2, description_en = $3 WHERE name = $4",
          [cat.nameEn, cat.description, cat.descriptionEn, cat.name]
        );
        console.log(`Updated: ${cat.name}`);
      }
    }
    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error("Error seeding categories:", err);
  } finally {
    await client.end();
  }
}

seedCategories();
