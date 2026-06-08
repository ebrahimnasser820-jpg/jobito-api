import { Controller, Get } from '@nestjs/common';
import { PublicStatsService } from './public-stats.service.js';

@Controller('public-stats')
export class PublicStatsController {
  constructor(private readonly publicStatsService: PublicStatsService) {}

  @Get()
  async getStats() {
    return this.publicStatsService.getStats();
  }
}
