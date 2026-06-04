import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Rating } from './rating.entity.js';
import { Application } from '../applications/application.entity.js';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingsRepository: Repository<Rating>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {}

  async create(
    dto: {
      companyId?: number;
      targetUserId?: string;
      targetCompanyId?: number;
      jobId?: number;
      ratingValue: number;
      comment?: string;
      raterType?: string;
    },
    currentUserId: string,
  ) {
    const isCompanyRater = dto.raterType === 'COMPANY';

    // Enforce 10-day waiting period after hiring before allowing rating
    if (dto.targetUserId) {
      const hiredApp = await this.applicationRepository.findOne({
        where: {
          userId: dto.targetUserId,
          status: In(['hired', 'accepted']),
        },
        order: { appliedAt: 'DESC' },
      });

      if (hiredApp) {
        const hiringDate = new Date(hiredApp.appliedAt).getTime();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        if (now < hiringDate + sevenDaysInMs) {
          const daysLeft = Math.ceil((hiringDate + sevenDaysInMs - now) / (1000 * 60 * 60 * 24));
          throw new BadRequestException(`لا يمكن التقييم قبل مرور 7 أيام من التوظيف. متبقي ${daysLeft} أيام.`);
        }
      }
    }

    const ratingData: any = {
      raterUserId: !isCompanyRater ? currentUserId : null,
      raterCompanyId: isCompanyRater ? dto.companyId : null,
      targetUserId: dto.targetUserId,
      targetCompanyId: !isCompanyRater ? dto.companyId : null,
      jobId: dto.jobId,
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
      relations: ['raterUser', 'job'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByJobId(jobId: number) {
    return this.ratingsRepository.find({
      where: { jobId },
      relations: ['raterUser', 'raterCompany'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(targetUserId: string) {
    return this.ratingsRepository.find({
      where: { targetUserId },
      relations: ['raterUser', 'raterCompany', 'job'],
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
