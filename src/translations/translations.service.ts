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
      result[t.translationKey] = lang === 'ar' ? t.ar : t.en;
    });
    
    return result;
  }

  async findAll(): Promise<Translation[]> {
    return this.translationsRepository.find();
  }
}
