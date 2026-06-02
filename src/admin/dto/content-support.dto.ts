import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class ReviewContentDto {
  @IsNumber()
  @IsNotEmpty()
  reportId: number;

  @IsString()
  @IsNotEmpty()
  action: 'delete' | 'dismiss';

  @IsOptional()
  @IsBoolean()
  notifyViolation?: boolean;
}

export class ReplyTicketDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
