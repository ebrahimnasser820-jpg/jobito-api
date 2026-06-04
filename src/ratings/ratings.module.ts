import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './rating.entity.js';
import { RatingsService } from './ratings.service.js';
import { RatingsController } from './ratings.controller.js';
import { Application } from '../applications/application.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Application])],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
