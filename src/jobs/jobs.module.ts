import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './job.entity.js';
import { Category } from './category.entity.js';
import { JobView } from './job-view.entity.js';
import { JobsService } from './jobs.service.js';
import { JobsController } from './jobs.controller.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

import { AuditLog } from '../audit-logs/audit-log.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Category, AuditLog]),
    CompaniesModule,
    AuditLogsModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule { }
