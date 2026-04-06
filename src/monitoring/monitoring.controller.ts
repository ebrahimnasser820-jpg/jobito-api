import { Controller, Get, Post, Body, Query, InternalServerErrorException } from '@nestjs/common';
import { ReportsService } from './services/reports.service.js';
import { LogsService } from './services/logs.service.js';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly logsService: LogsService,
  ) {}

  @Get('reports')
  async getReports() {
    return await this.reportsService.getReports();
  }

  @Post('log')
  async logExternalError(@Body() data: { message: string; metadata?: any }) {
    return await this.logsService.logError(data.message, data.metadata);
  }

  @Get('test-error')
  async triggerTestError(@Query('type') type: string) {
    if (type === 'db') {
      throw new Error('ECONNREFUSED: Unable to connect to database at localhost:5432');
    }
    if (type === '500') {
      throw new InternalServerErrorException('Simulated 500 error for monitoring test');
    }
    if (type === 'spam') {
      // Logic to trigger 25 errors quickly would be better in a script,
      // but let's just throw one and let the user call it multiple times.
      throw new Error('Spammy error message for frequency testing');
    }
    throw new Error('General system event test');
  }
}
