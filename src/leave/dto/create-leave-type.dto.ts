import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveUnitType } from '../enums/leave.enums';

export class CreateLeaveTypeDto {
  @ApiProperty({ description: 'Unique code', example: 'annual' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Display name', example: 'Annual Leave' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Unit type', enum: LeaveUnitType, required: false })
  @IsEnum(LeaveUnitType)
  @IsOptional()
  unitType?: LeaveUnitType;

  @ApiProperty({ description: 'Whether this leave is paid', required: false })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiProperty({ description: 'Whether balance is required', required: false })
  @IsBoolean()
  @IsOptional()
  requiresBalance?: boolean;

  @ApiProperty({ description: 'Whether attachment is required', required: false })
  @IsBoolean()
  @IsOptional()
  requiresAttachment?: boolean;

  @ApiProperty({ description: 'Attachment threshold in days', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  attachmentThresholdDays?: number;

  @ApiProperty({ description: 'Sort order', required: false })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ description: 'Color', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Icon', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateLeaveTypeDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsEnum(LeaveUnitType)
  @IsOptional()
  unitType?: LeaveUnitType;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  requiresBalance?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  requiresAttachment?: boolean;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  attachmentThresholdDays?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
