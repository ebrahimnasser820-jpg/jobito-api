import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationsService } from './translations.service.js';
import { TranslationEngineService } from './translation-engine.service.js';
import { TranslationsController } from './translations.controller.js';
import { Translation } from './entities/translation.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Translation])],
  controllers: [TranslationsController],
  providers: [TranslationsService, TranslationEngineService],
  exports: [TranslationsService, TranslationEngineService],
})
export class TranslationsModule {}
