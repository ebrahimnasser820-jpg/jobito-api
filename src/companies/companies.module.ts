import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller.js';
import { CompaniesService } from './companies.service.js';
import { Company } from './company.entity.js';
import { AuditLog } from '../audit-logs/audit-log.entity.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, AuditLog]),
    AuditLogsModule,
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
