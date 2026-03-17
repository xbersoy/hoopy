import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SessionType } from '../enums/leave.enums';

export class CreateLeaveRequestDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Leave type ID' })
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty({ description: 'Start date', example: '2026-04-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date', example: '2026-04-03' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: SessionType, required: false })
  @IsEnum(SessionType)
  @IsOptional()
  startSession?: SessionType;

  @ApiProperty({ enum: SessionType, required: false })
  @IsEnum(SessionType)
  @IsOptional()
  endSession?: SessionType;

  @ApiProperty({ description: 'Reason for leave', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateLeaveRequestDto {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ enum: SessionType, required: false })
  @IsEnum(SessionType)
  @IsOptional()
  startSession?: SessionType;

  @ApiProperty({ enum: SessionType, required: false })
  @IsEnum(SessionType)
  @IsOptional()
  endSession?: SessionType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
