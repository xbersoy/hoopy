import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  FeedbackRequestStatus,
  FeedbackSubmissionMode,
  AudienceTargetType,
} from '../enums';

export class CreateFeedbackRequestTemplateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  defaultTitle: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultInstructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  defaultCategoryId?: string;

  @ApiProperty({ required: false, enum: FeedbackSubmissionMode })
  @IsOptional()
  @IsEnum(FeedbackSubmissionMode)
  defaultSubmissionMode?: FeedbackSubmissionMode;

  @ApiProperty({ required: false })
  @IsOptional()
  defaultDueDays?: number;
}

export class UpdateFeedbackRequestTemplateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultInstructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  defaultCategoryId?: string;

  @ApiProperty({ required: false, enum: FeedbackSubmissionMode })
  @IsOptional()
  @IsEnum(FeedbackSubmissionMode)
  defaultSubmissionMode?: FeedbackSubmissionMode;

  @ApiProperty({ required: false })
  @IsOptional()
  defaultDueDays?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateFeedbackRequestDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ enum: FeedbackSubmissionMode })
  @IsEnum(FeedbackSubmissionMode)
  submissionMode: FeedbackSubmissionMode;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ enum: AudienceTargetType })
  @IsEnum(AudienceTargetType)
  audienceType: AudienceTargetType;

  @ApiProperty({ required: false })
  @IsOptional()
  audienceConfig?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  reminderSettings?: Record<string, any>;
}

export class UpdateFeedbackRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false, enum: FeedbackRequestStatus })
  @IsOptional()
  @IsEnum(FeedbackRequestStatus)
  status?: FeedbackRequestStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  reminderSettings?: Record<string, any>;
}

export class QueryFeedbackRequestDto {
  @ApiProperty({ required: false, enum: FeedbackRequestStatus })
  @IsOptional()
  @IsEnum(FeedbackRequestStatus)
  status?: FeedbackRequestStatus;

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
