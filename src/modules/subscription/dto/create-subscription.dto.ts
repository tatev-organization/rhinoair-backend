import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  @IsOptional()
  plan?: SubscriptionPlan;

  @IsString()
  @IsOptional()
  review?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsDateString()
  @IsNotEmpty()
  durationDate: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
