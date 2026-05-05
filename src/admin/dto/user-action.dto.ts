import { IsNotEmpty, IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { UserActionType } from '../entities/user-action.entity.js';

export class UserActionDto {
  @IsUUID()
  @IsNotEmpty()
  targetUserId: string;

  @IsEnum(UserActionType)
  @IsNotEmpty()
  actionType: UserActionType;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UserSearchDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  accountType?: string; // 'student', 'company', 'user'

  @IsString()
  @IsOptional()
  status?: string; // 'active', 'suspended', 'banned', 'warned'

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
