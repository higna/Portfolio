import { IsEmail, MinLength, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}