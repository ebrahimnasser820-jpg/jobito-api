import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './rating.entity.js';
import { RatingsService } from './ratings.service.js';
import { RatingsController } from './ratings.controller.js';
import { Application } from '../applications/application.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, Application]),
    NotificationsModule,
    CompaniesModule,
    UsersModule,
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
