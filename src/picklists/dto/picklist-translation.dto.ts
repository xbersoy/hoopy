import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PicklistTranslationDto {
  @ApiProperty({ description: 'Localized display name', example: 'Departments' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Localized description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
