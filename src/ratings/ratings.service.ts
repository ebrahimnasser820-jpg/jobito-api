import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity.js';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingsRepository: Repository<Rating>,
  ) {}

  async create(createRatingDto: { companyId: number; targetUserId?: string; ratingValue: number; comment?: string; raterType?: string }, userId: string) {
    const rating = this.ratingsRepository.create({
      companyId: createRatingDto.companyId,
      userId: createRatingDto.targetUserId || userId,
      ratingValue: createRatingDto.ratingValue,
      comment: createRatingDto.comment,
      raterType: createRatingDto.raterType || 'USER',
    });
    return this.ratingsRepository.save(rating);
  }

  async findByCompanyId(companyId: number) {
    return this.ratingsRepository.find({
      where: { companyId, raterType: 'USER' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string) {
    return this.ratingsRepository.find({
      where: { userId, raterType: 'COMPANY' },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  async findGivenByCompany(companyId: number) {
    return this.ratingsRepository.find({
      where: { companyId, raterType: 'COMPANY' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}

