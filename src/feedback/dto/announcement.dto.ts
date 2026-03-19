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
  AnnouncementStatus,
  AnnouncementPriority,
  AudienceTargetType,
} from '../enums';

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty({ required: false, enum: AnnouncementPriority })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requiresAcknowledgment?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  acknowledgmentDueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ enum: AudienceTargetType })
  @IsEnum(AudienceTargetType)
  audienceType: AudienceTargetType;

  @ApiProperty({ required: false })
  @IsOptional()
  audienceConfig?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  attachments?: Array<{ fileName: string; url: string; mimeType: string }>;
}

export class UpdateAnnouncementDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({ required: false, enum: AnnouncementPriority })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requiresAcknowledgment?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  acknowledgmentDueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  attachments?: Array<{ fileName: string; url: string; mimeType: string }>;
}

export class QueryAnnouncementDto {
  @ApiProperty({ required: false, enum: AnnouncementStatus })
  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus;

  @ApiProperty({ required: false, enum: AnnouncementPriority })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

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

export class QueryMyAnnouncementsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  unreadOnly?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  pendingAckOnly?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: number;
}
