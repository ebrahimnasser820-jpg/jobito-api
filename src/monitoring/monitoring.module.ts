import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringReport } from './entities/monitoring-report.entity.js';
import { AuditLog } from '../audit-logs/audit-log.entity.js';
import { RuleEngineService } from './services/rule-engine.service.js';
import { LogsService } from './services/logs.service.js';
import { ReportsService } from './services/reports.service.js';
import { AlertsService } from './services/alerts.service.js';
import { MailModule } from '../mail/mail.module.js';
import { MonitoringController } from './monitoring.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonitoringReport, AuditLog]),
    MailModule,
  ],
  controllers: [MonitoringController],
  providers: [
    RuleEngineService,
    LogsService,
    ReportsService,
    AlertsService,
  ],
  exports: [LogsService, ReportsService],
})
export class MonitoringModule {}
