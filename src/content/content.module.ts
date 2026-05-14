import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppServiceEntity } from './service.entity.js';
import { Feature } from './feature.entity.js';
import { AboutStat } from './about-stat.entity.js';
import { ContentService } from './content.service.js';
import { ContentController } from './content.controller.js';
import { AdminModule } from '../admin/admin.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppServiceEntity, Feature, AboutStat]),
    AdminModule,
  ],
  providers: [ContentService],
  controllers: [ContentController],
  exports: [ContentService],
})
export class ContentModule {}
