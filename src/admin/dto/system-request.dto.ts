import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { SystemRequestType } from '../entities/system-request.entity.js';

export class CreateSystemRequestDto {
  @IsEnum(SystemRequestType)
  @IsNotEmpty()
  requestType: SystemRequestType;

  @IsString()
  @IsNotEmpty()
  candidateName: string;

  @IsString()
  @IsNotEmpty()
  candidateEmail: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ReviewSystemRequestDto {
  @IsString()
  @IsNotEmpty()
  action: 'approve' | 'reject';

  @IsString()
  @IsOptional()
  reviewNote?: string;
}
