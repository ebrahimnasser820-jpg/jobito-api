import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicStatsController } from './public-stats.controller.js';
import { PublicStatsService } from './public-stats.service.js';
import { User } from '../users/user.entity.js';
import { Company } from '../companies/company.entity.js';
import { Job } from '../jobs/job.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company, Job])],
  controllers: [PublicStatsController],
  providers: [PublicStatsService],
})
export class PublicStatsModule {}
