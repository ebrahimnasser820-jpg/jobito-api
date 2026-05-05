import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class ReviewContentDto {
  @IsNumber()
  @IsNotEmpty()
  reportId: number;

  @IsString()
  @IsNotEmpty()
  action: 'delete' | 'dismiss';
}

export class ReplyTicketDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
