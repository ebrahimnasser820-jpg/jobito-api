import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { Translation } from './src/translations/entities/translation.entity.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo = app.get<Repository<Translation>>(getRepositoryToken(Translation));

  const missing = [
    { en: 'Operations Monitor', ar: 'مراقب العمليات' },
    { en: 'Technical Support', ar: 'الدعم الفني' },
    { en: 'Company Review', ar: 'مراجعة الشركة' },
    { en: 'Operations Revenue', ar: 'إيرادات العمليات' }
  ];

  for (const item of missing) {
    const existing = await repo.findOne({ where: { en: item.en } });
    if (existing) {
      existing.ar = item.ar;
      await repo.save(existing);
    } else {
      const newTrans = new Translation();
      const hash = Buffer.from(item.en).toString('hex').slice(0, 16);
      newTrans.translationKey = `manual.${hash}`;
      newTrans.en = item.en;
      newTrans.ar = item.ar;
      await repo.save(newTrans);
    }
  }

  console.log('Injected missing translations!');
  await app.close();
}

bootstrap().catch(console.error);
