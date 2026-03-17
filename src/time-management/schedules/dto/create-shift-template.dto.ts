import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShiftTemplateDto {
  @ApiProperty({ description: 'Unique code within company' })
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({ description: 'Shift template name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Shift start time (HH:mm)' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Shift end time (HH:mm)' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: 'Break duration in minutes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  breakDurationMinutes?: number;

  @ApiProperty({
    description: 'Whether the shift is overnight',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isOvernight?: boolean;

  @ApiProperty({ description: 'Display color', required: false })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Translations keyed by locale', required: false })
  @IsObject()
  @IsOptional()
  translations?: Record<string, { name: string; description?: string }>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateShiftTemplateDto {
  @ApiProperty({ description: 'Shift template name', required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Shift start time (HH:mm)', required: false })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: 'Shift end time (HH:mm)', required: false })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: 'Break duration in minutes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  breakDurationMinutes?: number;

  @ApiProperty({
    description: 'Whether the shift is overnight',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isOvernight?: boolean;

  @ApiProperty({ description: 'Display color', required: false })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: 'Whether the template is active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Translations keyed by locale', required: false })
  @IsObject()
  @IsOptional()
  translations?: Record<string, { name: string; description?: string }>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
