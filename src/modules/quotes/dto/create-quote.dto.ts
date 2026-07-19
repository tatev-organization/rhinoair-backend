import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuoteDto {
  @ApiProperty({ example: 'John Doe Builders' })
  @IsString()
  builderName: string;

  @ApiPropertyOptional({ example: '123 Main St, Springfield' })
  @IsString()
  @IsOptional()
  projectAddress?: string;

  @ApiPropertyOptional({ example: 'Full system replacement' })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiPropertyOptional({ example: 'Premium' })
  @IsString()
  @IsOptional()
  tierLabel?: string;

  @ApiProperty({ example: 4500 })
  @IsNumber()
  total: number;

  @ApiProperty({ example: { project: {}, systems: [] } })
  @IsObject()
  payload: any;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsString()
  @IsOptional()
  stCustomerId?: string;
}
