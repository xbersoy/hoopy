import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  FeedbackSubmissionMode,
  FeedbackStatus,
  FeedbackSensitivity,
} from '../enums';

export class CreateFeedbackItemDto {
  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ enum: FeedbackSubmissionMode })
  @IsEnum(FeedbackSubmissionMode)
  submissionMode: FeedbackSubmissionMode;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  subject: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty({ required: false, enum: FeedbackSensitivity })
  @IsOptional()
  @IsEnum(FeedbackSensitivity)
  sensitivity?: FeedbackSensitivity;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  feedbackRequestId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateFeedbackItemDto {
  @ApiProperty({ required: false, enum: FeedbackStatus })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiProperty({ required: false, enum: FeedbackSensitivity })
  @IsOptional()
  @IsEnum(FeedbackSensitivity)
  sensitivity?: FeedbackSensitivity;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AddFeedbackMessageDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isInternal?: boolean;
}

export class QueryFeedbackItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false, enum: FeedbackStatus })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiProperty({ required: false, enum: FeedbackSensitivity })
  @IsOptional()
  @IsEnum(FeedbackSensitivity)
  sensitivity?: FeedbackSensitivity;

  @ApiProperty({ required: false, enum: FeedbackSubmissionMode })
  @IsOptional()
  @IsEnum(FeedbackSubmissionMode)
  submissionMode?: FeedbackSubmissionMode;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

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
