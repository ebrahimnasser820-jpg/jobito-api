import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateServiceRequestDto {
  @IsUUID()
  @IsNotEmpty()
  tradesmanId: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
