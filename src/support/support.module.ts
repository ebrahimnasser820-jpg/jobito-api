import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './support.controller.js';
import { MailModule } from '../mail/mail.module.js';
import { HelpCategory } from './help-category.entity.js';
import { HelpArticle } from './help-article.entity.js';
import { SupportService } from './support.service.js';

@Module({
  imports: [
    MailModule,
    TypeOrmModule.forFeature([HelpCategory, HelpArticle]),
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
