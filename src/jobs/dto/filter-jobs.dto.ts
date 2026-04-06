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
}
