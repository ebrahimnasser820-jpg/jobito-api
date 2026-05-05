import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class ReviewCompanyDto {
  @IsNumber()
  @IsNotEmpty()
  companyId: number;

  @IsString()
  @IsNotEmpty()
  action: 'approve' | 'reject';

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
