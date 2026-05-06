import { IsNotEmpty, IsString, IsOptional, IsUrl, IsNumber, IsUUID } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  @IsNotEmpty()
  businessCategory: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  competitor?: string;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  review?: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
