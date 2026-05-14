import { Controller, Get, Post, Body } from '@nestjs/common';
import { ContentService } from './content.service.js';
import { AdminContentManagementService } from '../admin/services/admin-content-management.service.js';

@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly adminContentService: AdminContentManagementService,
  ) {}

  @Get('services')
  getServices() {
    return this.contentService.findAllServices();
  }

  @Get('features')
  getFeatures() {
    return this.contentService.findAllFeatures();
  }

  @Get('stats')
  getStats() {
    return this.contentService.findAllStats();
  }

  @Post('reports')
  createReport(@Body() data: any) {
    return this.adminContentService.submitReport(data);
  }
}
