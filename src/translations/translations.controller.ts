import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TranslationsService } from './translations.service.js';
import { TranslationEngineService } from './translation-engine.service.js';

@Controller('translations')
export class TranslationsController {
  constructor(
    private readonly translationsService: TranslationsService,
    private readonly translationEngine: TranslationEngineService
  ) {}

  @Get()
  async getTranslations(@Query('lang') lang: string = 'en') {
    const language = lang === 'ar' ? 'ar' : 'en';
    return this.translationsService.getTranslations(language);
  }

  @Post('batch')
  async translateBatch(
    @Body() body: { texts: string[]; target_lang: 'ar' | 'en' }
  ) {
    try {
      const { texts, target_lang } = body;
      const translated_texts = await this.translationEngine.translateBatch(texts, target_lang);
      return { translated_texts };
    } catch (err) {
      console.error('[Batch Error]:', err);
      return { 
        error: true, 
        message: err.message, 
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
      };
    }
  }
}
