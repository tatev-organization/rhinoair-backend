import { IsEmail, IsNotEmpty, IsString, IsUrl, IsOptional, IsInt } from 'class-validator';

export class CreateSystemDto {
  @IsEmail()
  @IsNotEmpty()
  supportEmail: string;

  @IsUrl()
  @IsNotEmpty()
  supportUrl: string;

  @IsString()
  @IsNotEmpty()
  siteName: string;

  @IsInt()
  @IsOptional()
  freeTrialDuration?: number;

  @IsInt()
  @IsOptional()
  planLimitMaxBusiness?: number;

  @IsInt()
  @IsOptional()
  planLimitMaxLocations?: number;
}
