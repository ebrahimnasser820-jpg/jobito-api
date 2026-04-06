import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity.js';
import { Job } from '../jobs/job.entity.js';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
  ) {}

  async toggleFavorite(userId: string, jobId: number): Promise<{ isFavorite: boolean }> {
    const job = await this.jobsRepository.findOne({ where: { jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const existing = await this.favoritesRepository.findOne({
      where: { userId, jobId },
    });

    if (existing) {
      await this.favoritesRepository.remove(existing);
      return { isFavorite: false };
    } else {
      const favorite = this.favoritesRepository.create({ userId, jobId });
      await this.favoritesRepository.save(favorite);
      return { isFavorite: true };
    }
  }

  async getUserFavorites(userId: string): Promise<number[]> {
    const favorites = await this.favoritesRepository.find({
      where: { userId },
      select: ['jobId'],
    });
    return favorites.map((f) => Number(f.jobId));
  }
}
