import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './favorite.entity.js';
import { FavoritesService } from './favorites.service.js';
import { FavoritesController } from './favorites.controller.js';
import { Job } from '../jobs/job.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Job])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
