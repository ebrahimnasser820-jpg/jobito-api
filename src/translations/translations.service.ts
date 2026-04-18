import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Translation } from './entities/translation.entity.js';

@Injectable()
export class TranslationsService {
  constructor(
    @InjectRepository(Translation)
    private translationsRepository: Repository<Translation>,
  ) {}

  async getTranslations(lang: 'en' | 'ar'): Promise<Record<string, string>> {
    const translations = await this.translationsRepository.find();
    const result: Record<string, string> = {};
    
    translations.forEach((t) => {
      // Key by translation_key (e.g. 'nav.home') for backward compatibility
      result[t.translationKey] = lang === 'ar' ? t.ar : t.en;

      // Key by Arabic text so t("الرئيسية") → "Home" when lang=en
      // and t("الرئيسية") → "الرئيسية" when lang=ar
      if (t.ar) {
        result[t.ar] = lang === 'ar' ? t.ar : t.en;
      }

      // Key by English text so t("Home") → "الرئيسية" when lang=ar
      // and t("Home") → "Home" when lang=en
      if (t.en) {
        result[t.en] = lang === 'ar' ? t.ar : t.en;
      }
    });
    
    return result;
  }

  async findAll(): Promise<Translation[]> {
    return this.translationsRepository.find();
  }
}
