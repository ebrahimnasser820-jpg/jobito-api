
import { AppDataSource } from './src/database/typeorm.config.js';
import { JobsService } from './src/jobs/jobs.service.js';
import { Job } from './src/jobs/job.entity.js';

async function test() {
  try {
    console.log('Initializing data source...');
    await AppDataSource.initialize();
    console.log('Data source initialized.');

    const repo = AppDataSource.getRepository(Job);
    const service = new JobsService(repo, AppDataSource);

    console.log('Testing findAll...');
    const result = await service.findAll({});
    console.log('Results count:', result.data.length);
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

test();
