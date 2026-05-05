import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { AdminRole } from '../entities/admin.entity.js';

export class InviteAdminDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(AdminRole)
  @IsNotEmpty()
  role: AdminRole;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;
}

export class CreateFirstAdminDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
