import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AccountInfoDto {
  @ApiProperty({
    description: 'Account name',
    example: 'My Account',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Account type',
    example: 'Personal',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Account settings',
    example: { theme: 'dark', language: 'en' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

export class CompanyInfoDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Acme Inc.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Company sector',
    example: 'Technology',
  })
  @IsString()
  @IsNotEmpty()
  sector: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Account information',
    type: AccountInfoDto,
  })
  @ValidateNested()
  @Type(() => AccountInfoDto)
  @IsNotEmpty()
  account: AccountInfoDto;

  @ApiProperty({
    description: 'Company information',
    type: CompanyInfoDto,
  })
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  @IsNotEmpty()
  company: CompanyInfoDto;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;
}
