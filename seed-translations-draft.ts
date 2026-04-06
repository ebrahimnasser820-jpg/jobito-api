import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { TranslationsService } from './src/translations/translations.service.js';
import { Translation } from './src/translations/entities/translation.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(TranslationsService);
  const repo = app.get('TranslationRepository'); // This might be tricky, usually it's getRepositoryToken(Translation)

  const data = [
    { translationKey: 'nav.home', en: 'Home', ar: 'الرئيسية' },
    { translationKey: 'nav.find_jobs', en: 'Find Jobs', ar: 'ابحث عن وظيفة' },
    { translationKey: 'auth.login_title', en: 'Login', ar: 'تسجيل الدخول' },
    // ... add a few more for testing
  ];

  console.log('Seeding translations...');
  for (const item of data) {
    // We can use the repo from service or just use service if it has a save method
    // Since service doesn't have save, we'll just log or find another way.
  }
  
  await app.close();
}
// This is getting complicated. I'll just use a simpler SQL-based approach but verify success.
