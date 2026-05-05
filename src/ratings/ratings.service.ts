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

  async create(dto: { companyId?: number; targetUserId?: string; targetCompanyId?: number; ratingValue: number; comment?: string; raterType?: string }, currentUserId: string) {
    const isCompanyRater = dto.raterType === 'COMPANY';
    
    // In our system, if raterType is COMPANY, we might need to find their companyId if not provided
    // For now, we assume the frontend sends the IDs correctly or we'd need a Company service here.
    
    const ratingData: any = {
      raterUserId: !isCompanyRater ? currentUserId : null,
      raterCompanyId: isCompanyRater ? dto.companyId : null,
      targetUserId: dto.targetUserId,
      targetCompanyId: !isCompanyRater ? dto.companyId : null,
      ratingValue: dto.ratingValue,
      comment: dto.comment,
      raterType: dto.raterType || 'USER',
    };
    
    const rating = this.ratingsRepository.create(ratingData as Rating);
    return this.ratingsRepository.save(rating);

  }

  async findByCompanyId(targetCompanyId: number) {
    return this.ratingsRepository.find({
      where: { targetCompanyId, raterType: 'USER' },
      relations: ['raterUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(targetUserId: string) {
    return this.ratingsRepository.find({
      where: { targetUserId },
      relations: ['raterUser', 'raterCompany'],
      order: { createdAt: 'DESC' },
    });
  }

  async findGivenByCompany(raterCompanyId: number) {
    return this.ratingsRepository.find({
      where: { raterCompanyId, raterType: 'COMPANY' },
      relations: ['targetUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findGivenByUserId(raterUserId: string) {
    return this.ratingsRepository.find({
      where: { raterUserId, raterType: 'USER' },
      relations: ['targetUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAverageRatingForUser(userId: string) {
    const result = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.ratingValue)', 'avg')
      .where('rating.targetUserId = :userId', { userId })
      .getRawOne();
    return parseFloat(result?.avg || '0');
  }

  async getAverageRatingForCompany(companyId: number) {
    const result = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.ratingValue)', 'avg')
      .where('rating.targetCompanyId = :companyId', { companyId })
      .getRawOne();
    return parseFloat(result?.avg || '0');
  }
}

