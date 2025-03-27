import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
} 