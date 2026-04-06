import { Controller, Get, Query } from '@nestjs/common';
import { TranslationsService } from './translations.service.js';

@Controller('translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get()
  async getTranslations(@Query('lang') lang: string = 'en') {
    const language = lang === 'ar' ? 'ar' : 'en';
    return this.translationsService.getTranslations(language);
  }
}
