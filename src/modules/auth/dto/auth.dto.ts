import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'partner@rhinoair.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Alex Partner',
    description: 'User full name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '7f7b2a5e-3b7f-4a4d-ae8d-45f2755f1d5a',
    description: 'Company ID for partner users',
  })
  @IsUUID()
  @IsOptional()
  companyId?: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'partner@rhinoair.com',
    description: 'Registered user email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Registered user password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token returned from login',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'partner@rhinoair.com',
    description: 'Email address that should receive a reset code',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'partner@rhinoair.com',
    description: 'Account email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Password reset verification code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'newPassword123',
    minLength: 6,
    description: 'New password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class VerificationDto {
  @ApiProperty({
    example: 'partner@rhinoair.com',
    description: 'Account email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Email verification code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
