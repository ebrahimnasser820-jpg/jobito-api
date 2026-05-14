import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesController } from './companies.controller.js';
import { CompaniesService } from './companies.service.js';
import { Company } from './company.entity.js';
import { AuditLog } from '../audit-logs/audit-log.entity.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { MongoCompanyProfile, MongoCompanyProfileSchema } from './schemas/mongo-company-profile.schema.js';
import { MongoCompanyProfileService } from './mongo-company-profile.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, AuditLog]),
    MongooseModule.forFeature([{ name: MongoCompanyProfile.name, schema: MongoCompanyProfileSchema }]),
    AuditLogsModule,
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService, MongoCompanyProfileService],
  exports: [CompaniesService, MongoCompanyProfileService],
})
export class CompaniesModule {}
