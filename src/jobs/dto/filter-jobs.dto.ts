import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { JobType } from '../job.entity.js';

export class FilterJobsDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(JobType)
    jobType?: JobType;

    @IsOptional()
    @IsNumberString()
    categoryId?: string;

    @IsOptional()
    @IsNumberString()
    companyId?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsNumberString()
    page?: string;

    @IsOptional()
    @IsNumberString()
    limit?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    classification?: string;

    @IsOptional()
    @IsString()
    excludeClassification?: string;

    @IsOptional()
    @IsString()
    jobLevel?: string;

    @IsOptional()
    @IsString()
    salaryRange?: string;

    @IsOptional()
    @IsString()
    ownerType?: string;

    @IsOptional()
    @IsString()
    _t?: string;
}
