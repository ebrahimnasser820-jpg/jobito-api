import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobType } from '../job.entity.js';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  companyId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salary?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMax?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  slotsAvailable?: number;

  @IsOptional()
  @IsString()
  priceType?: string;

  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @IsOptional()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  classification?: string;

  @IsOptional()
  benefits?: any;
}
