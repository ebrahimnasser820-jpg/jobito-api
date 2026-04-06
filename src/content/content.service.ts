import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppServiceEntity } from './service.entity.js';
import { Feature } from './feature.entity.js';
import { AboutStat } from './about-stat.entity.js';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(AppServiceEntity)
    private servicesRepo: Repository<AppServiceEntity>,
    @InjectRepository(Feature)
    private featuresRepo: Repository<Feature>,
    @InjectRepository(AboutStat)
    private statsRepo: Repository<AboutStat>,
  ) {}

  findAllServices() {
    return this.servicesRepo.find();
  }

  findAllFeatures() {
    return this.featuresRepo.find();
  }

  findAllStats() {
    return this.statsRepo.find();
  }
}
