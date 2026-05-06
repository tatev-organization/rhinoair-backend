import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCardInfoDto {
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @IsString()
  @IsNotEmpty()
  cvc: string;

  @IsString()
  @IsNotEmpty()
  expiryDate: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
