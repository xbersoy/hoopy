import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  SurveyStatus,
  SurveyRecurrence,
  AudienceTargetType,
} from '../enums';
import { CreateSurveyQuestionDto } from './survey-template.dto';

export class CreateSurveyDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowEditUntilDue?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  closeDate?: string;

  @ApiProperty({ required: false, enum: SurveyRecurrence })
  @IsOptional()
  @IsEnum(SurveyRecurrence)
  recurrence?: SurveyRecurrence;

  @ApiProperty({ enum: AudienceTargetType })
  @IsEnum(AudienceTargetType)
  audienceType: AudienceTargetType;

  @ApiProperty({ required: false })
  @IsOptional()
  audienceConfig?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  reminderSettings?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  anonymityThreshold?: number;

  @ApiProperty({ required: false, type: [CreateSurveyQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions?: CreateSurveyQuestionDto[];
}

export class UpdateSurveyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowEditUntilDue?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  closeDate?: string;

  @ApiProperty({ required: false, enum: SurveyRecurrence })
  @IsOptional()
  @IsEnum(SurveyRecurrence)
  recurrence?: SurveyRecurrence;

  @ApiProperty({ required: false })
  @IsOptional()
  reminderSettings?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  anonymityThreshold?: number;

  @ApiProperty({ required: false, type: [CreateSurveyQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions?: CreateSurveyQuestionDto[];
}

export class QuerySurveyDto {
  @ApiProperty({ required: false, enum: SurveyStatus })
  @IsOptional()
  @IsEnum(SurveyStatus)
  status?: SurveyStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: number;
}
