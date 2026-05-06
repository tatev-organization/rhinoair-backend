import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ActivityStatus } from '@prisma/client';

export class CreateActivityLogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(ActivityStatus)
  @IsNotEmpty()
  status: ActivityStatus;
}
