import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from './users.service.js';

@Injectable()
export class DeletionCleanupService {
  private readonly logger = new Logger(DeletionCleanupService.name);

  constructor(private readonly usersService: UsersService) {}

  // Run every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    this.logger.log('🚀 Starting daily account deletion cleanup cron job...');
    try {
      await this.usersService.processExpiredDeletions();
      this.logger.log('✅ Account deletion cleanup completed successfully.');
    } catch (error) {
      this.logger.error(`❌ Error during account deletion cleanup: ${error.message}`);
    }
  }

  // Optional: Run on application bootstrap for immediate cleanup if needed
  // onModuleInit() { this.handleCleanup(); }
}
