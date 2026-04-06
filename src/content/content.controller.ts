import { Controller, Get } from '@nestjs/common';
import { ContentService } from './content.service.js';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

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
}
