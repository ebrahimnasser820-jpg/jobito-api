import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class ReviewCompanyDto {
  @IsNotEmpty()
  companyId: number | string;

  @IsString()
  @IsNotEmpty()
  action: 'approve' | 'reject';

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
