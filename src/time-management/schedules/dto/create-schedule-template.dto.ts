import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsNumber,
  IsArray,
  IsObject,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ScheduleType } from '../enums/schedule.enums';

class TranslationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateScheduleTemplateDto {
  @ApiProperty({ description: 'Unique code within company' })
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({ description: 'Schedule template name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Schedule type', enum: ScheduleType, required: false })
  @IsEnum(ScheduleType)
  @IsOptional()
  scheduleType?: ScheduleType;

  @ApiProperty({ description: 'Work days', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  workDays?: string[];

  @ApiProperty({ description: 'Default start time (HH:mm)', required: false })
  @IsString()
  @IsOptional()
  defaultStartTime?: string;

  @ApiProperty({ description: 'Default end time (HH:mm)', required: false })
  @IsString()
  @IsOptional()
  defaultEndTime?: string;

  @ApiProperty({ description: 'Break duration in minutes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  breakDurationMinutes?: number;

  @ApiProperty({ description: 'Whether the schedule is overnight', required: false })
  @IsBoolean()
  @IsOptional()
  isOvernight?: boolean;

  @ApiProperty({ description: 'Weekly hours', required: false })
  @IsNumber()
  @IsOptional()
  weeklyHours?: number;

  @ApiProperty({ description: 'Translations keyed by locale', required: false })
  @IsObject()
  @IsOptional()
  translations?: Record<string, { name: string; description?: string }>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateScheduleTemplateDto {
  @ApiProperty({ description: 'Schedule template name', required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Schedule type', enum: ScheduleType, required: false })
  @IsEnum(ScheduleType)
  @IsOptional()
  scheduleType?: ScheduleType;

  @ApiProperty({ description: 'Work days', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  workDays?: string[];

  @ApiProperty({ description: 'Default start time (HH:mm)', required: false })
  @IsString()
  @IsOptional()
  defaultStartTime?: string;

  @ApiProperty({ description: 'Default end time (HH:mm)', required: false })
  @IsString()
  @IsOptional()
  defaultEndTime?: string;

  @ApiProperty({ description: 'Break duration in minutes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  breakDurationMinutes?: number;

  @ApiProperty({ description: 'Whether the schedule is overnight', required: false })
  @IsBoolean()
  @IsOptional()
  isOvernight?: boolean;

  @ApiProperty({ description: 'Weekly hours', required: false })
  @IsNumber()
  @IsOptional()
  weeklyHours?: number;

  @ApiProperty({ description: 'Whether the template is active', required: false })
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
