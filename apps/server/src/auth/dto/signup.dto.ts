import { IsEmail, MinLength, IsOptional, IsString } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsString()
  captchaToken!: string;
}