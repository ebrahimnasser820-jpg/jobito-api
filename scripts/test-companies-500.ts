 import { AppDataSource } from '../src/database/typeorm.config.js';
import { Company } from '../src/companies/company.entity.js';

async function testQuery() {
  try {
    await AppDataSource.initialize();
    
    // Test basic find
    console.log("Testing basic find...");
    const companies = await AppDataSource.getRepository(Company).find({
      relations: ['jobs', 'jobs.category'],
      order: { companyId: 'DESC' },
    });
    
    console.log(`Success! Found ${companies.length} companies.`);
  } catch (err) {
    console.error("TypeORM Error:", err);
  } finally {
    await AppDataSource.destroy();
  }
}

testQuery();
