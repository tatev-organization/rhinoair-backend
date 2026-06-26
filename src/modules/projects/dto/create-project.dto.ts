import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  QUOTED: 'QUOTED',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
} as const;

type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export class CreateProjectDto {
  @ApiPropertyOptional({
    example: '7f7b2a5e-3b7f-4a4d-ae8d-45f2755f1d5a',
    description: 'Company ID. Required for admin-created projects; partners use their own company automatically.',
  })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @ApiProperty({
    example: '1036 Norman Pl',
    description: 'Project name or job label',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '1036 Norman Pl, Los Angeles, CA',
    description: 'Project address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
    description: 'Project lifecycle status',
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({
    example: 'Daikin VRV · 5-Ton',
    description: 'Short system summary shown in project cards',
  })
  @IsString()
  @IsOptional()
  systemSummary?: string;

  @ApiPropertyOptional({
    example: 'Rough-in',
    description: 'Current project phase label',
  })
  @IsString()
  @IsOptional()
  currentPhase?: string;

  @ApiPropertyOptional({
    example: 'roughin',
    description: 'Frontend display class for the current phase',
  })
  @IsString()
  @IsOptional()
  phaseClass?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Current phase index for the project tracker',
  })
  @IsNumber()
  @IsOptional()
  currentPhaseIndex?: number;

  @ApiPropertyOptional({
    example: 26500,
    description: 'Accepted or quoted contract total',
  })
  @IsNumber()
  @IsOptional()
  contractTotal?: number;

  @ApiPropertyOptional({
    example: 10600,
    description: 'Amount paid so far',
  })
  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @ApiPropertyOptional({
    example: '2026-06-02T00:00:00.000Z',
    description: 'Project start date',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-07-11T00:00:00.000Z',
    description: 'Target completion date',
  })
  @IsDateString()
  @IsOptional()
  targetDate?: string;
}
