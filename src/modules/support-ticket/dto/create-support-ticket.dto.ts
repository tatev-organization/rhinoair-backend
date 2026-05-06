import { IsNotEmpty, IsString, IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';
import { SupportTicketStatus, SupportTicketPriority, SupportTicketCategory } from '@prisma/client';

export class CreateSupportTicketDto {
  @IsEnum(SupportTicketStatus)
  @IsOptional()
  status?: SupportTicketStatus;

  @IsEnum(SupportTicketPriority)
  @IsOptional()
  priority?: SupportTicketPriority;

  @IsEnum(SupportTicketCategory)
  @IsNotEmpty()
  category: SupportTicketCategory;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  property?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  userIds?: string[];
}
