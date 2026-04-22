import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsIn, IsString } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  confirmPassword?: string;

  @IsOptional()
  @IsIn(['user', 'company', 'student', 'admin'])
  role?: string;

  // User fields — accept both full_name and fullName from frontend
  @IsOptional()
  @IsNotEmpty()
  full_name?: string;

  @IsOptional()
  @IsNotEmpty()
  fullName?: string;

  @IsOptional()
  skills?: any;

  @IsOptional()
  experience?: number;

  // Company fields
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  contact_email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cr_document_url?: string;

  @IsOptional()
  @IsString()
  tax_number?: string;

  @IsOptional()
  @IsString()
  commercial_register?: string;

  @IsOptional()
  @IsString()
  national_id?: string;

  @IsOptional()
  @IsString()
  license_number?: string;
}
