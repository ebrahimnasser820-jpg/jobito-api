
import { DataSource } from 'typeorm';
import { Company } from './src/companies/company.entity.js';
import { Job } from './src/jobs/job.entity.js';
import { Category } from './src/jobs/category.entity.js';
import { Application } from './src/applications/application.entity.js';
import { User } from './src/users/user.entity.js';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'mlpoknbv',
  database: 'jobito',
  entities: [Company, Job, Category, Application, User],
  logging: true,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("DB initialized.");
    
    const repo = AppDataSource.getRepository(Category);
    
    const categories = [
      { name: 'تصميم', nameEn: 'Design', description: 'وظائف التصميم الجرافيكي وواجهة المستخدم', descriptionEn: 'Graphic and UI/UX design positions' },
      { name: 'مبيعات', nameEn: 'Sales', description: 'وظائف المبيعات وتطوير الأعمال', descriptionEn: 'Sales and business development roles' },
      { name: 'تسويق', nameEn: 'Marketing', description: 'التسويق الرقمي وإدارة المحتوى', descriptionEn: 'Digital marketing and content management' },
      { name: 'مالية', nameEn: 'Finance', description: 'المحاسبة والإدارة المالية', descriptionEn: 'Accounting and financial management' },
      { name: 'تكنولوجيا', nameEn: 'Technology', description: 'تطوير البرمجيات وتكنولوجيا المعلومات', descriptionEn: 'Software development and IT roles' },
      { name: 'هندسة', nameEn: 'Engineering', description: 'الهندسة والأنظمة التقنية', descriptionEn: 'Engineering and technical systems' },
      { name: 'إدارة', nameEn: 'Management', description: 'الإدارة وقيادة الفرق', descriptionEn: 'Management and team leadership' },
    ];

    console.log("Seeding categories...");
    for (const cat of categories) {
      const existing = await repo.findOneBy({ name: cat.name });
      if (!existing) {
        await repo.save(cat);
        console.log("Seeded:", cat.name);
      } else {
        console.log("Already exists:", cat.name);
      }
    }
    console.log("Done!");
    
  } catch (err) {
    console.error("FAILED with error:");
    console.error(err);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
