import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

const UserRole = {
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

const UserStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const;

type UserRole = (typeof UserRole)[keyof typeof UserRole];
type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export class CreateUserDto {
  @ApiPropertyOptional({
    example: 123456,
    description: 'Email verification OTP',
  })
  @IsOptional()
  otp?: number;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.PARTNER,
    description: 'User role',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    example: 'Alex Partner',
    description: 'User full name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'partner@rhinoair.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    example: '7f7b2a5e-3b7f-4a4d-ae8d-45f2755f1d5a',
    description: 'Company ID for partner users',
  })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({
    example: '+1 555 0100',
    description: 'User phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'User account status',
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the user email is verified',
  })
  @IsOptional()
  isVerified?: boolean;
}
