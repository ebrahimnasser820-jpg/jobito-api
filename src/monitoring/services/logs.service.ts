import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../audit-logs/audit-log.entity.js';
import { ReportsService } from './reports.service.js';
import { AlertsService } from './alerts.service.js';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private errorCache = new Map<string, { count: number; firstSeen: number }>();

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    private reportsService: ReportsService,
    private alertsService: AlertsService,
  ) {
    // Basic cache cleanup every minute
    setInterval(() => this.cleanupCache(), 60000);
  }

  /**
   * Main entry point for logging errors and triggering the smart analysis.
   */
  async logError(error: any, metadata: any = {}) {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    const errorKey = errorMessage.substring(0, 50); // Use a prefix as a key for frequency

    // Track frequency in 1-minute window
    const now = Date.now();
    const stats = this.errorCache.get(errorKey) || { count: 0, firstSeen: now };

    if (now - stats.firstSeen > 60000) {
      stats.count = 1;
      stats.firstSeen = now;
    } else {
      stats.count++;
    }
    this.errorCache.set(errorKey, stats);

    // Save to raw audit logs (existing system)
    const log = this.auditLogRepo.create({
      action: 'SYSTEM_ERROR',
      entity: 'MONITORING',
      entityId: errorKey,
      metadata: {
        message: errorMessage,
        stack: error.stack,
        ...metadata,
      }
    });
    
    try {
      await this.auditLogRepo.save(log);
    } catch (err) {
      this.logger.error(`Failed to save audit log: ${err.message}`);
    }

    // Generate smart report if it's the first time or high frequency
    if (stats.count === 1 || stats.count % 20 === 0) {
      const report = await this.reportsService.generateReport(errorMessage, stats.count, metadata);
      
      // Trigger alerts if necessary
      await this.alertsService.triggerAlert(report);
    }

    return stats.count;
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [key, stats] of this.errorCache.entries()) {
      if (now - stats.firstSeen > 60000) {
        this.errorCache.delete(key);
      }
    }
  }
}
