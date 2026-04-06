import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLog } from './audit-log.entity.js';
import { AiMonitoringService } from './ai-monitoring.service.js';
import { AiMonitoringInterceptor } from './ai-monitoring.interceptor.js';
import { AiSmartService } from './ai-smart.service.js';
import { AiSmartController } from './ai-smart.controller.js';
import { AiAnalyticsService } from './ai-analytics.service.js';
import { UsersModule } from '../users/users.module.js';
import { MailModule } from '../mail/mail.module.js';
import { Job } from '../jobs/job.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, Job]),
    UsersModule,
    MailModule,
  ],
  controllers: [AiSmartController],
  providers: [
    AiMonitoringService,
    AiSmartService,
    AiAnalyticsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AiMonitoringInterceptor,
    },
  ],
  exports: [TypeOrmModule, AiMonitoringService, AiSmartService, AiAnalyticsService],
})
export class AuditLogsModule {}
