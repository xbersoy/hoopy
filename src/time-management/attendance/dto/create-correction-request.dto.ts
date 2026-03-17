import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CorrectionType } from '../enums/attendance.enums';

export class CreateCorrectionRequestDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Related attendance record ID', required: false })
  @IsUUID()
  @IsOptional()
  attendanceRecordId?: string;

  @ApiProperty({ description: 'Date for correction', example: '2026-04-01' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Correction type', enum: CorrectionType })
  @IsEnum(CorrectionType)
  correctionType: CorrectionType;

  @ApiProperty({ description: 'Requested check-in time', required: false })
  @IsDateString()
  @IsOptional()
  requestedCheckIn?: string;

  @ApiProperty({ description: 'Requested check-out time', required: false })
  @IsDateString()
  @IsOptional()
  requestedCheckOut?: string;

  @ApiProperty({ description: 'Reason for correction' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ReviewCorrectionRequestDto {
  @ApiProperty({ description: 'Review notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
