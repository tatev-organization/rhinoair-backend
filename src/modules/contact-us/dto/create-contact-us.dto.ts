import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateContactUsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
