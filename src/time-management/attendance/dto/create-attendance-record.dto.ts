import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus, CheckSource } from '../enums/attendance.enums';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class CreateAttendanceRecordDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Attendance date', example: '2026-04-01' })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Attendance status',
    enum: AttendanceStatus,
    required: false,
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiProperty({ description: 'Check-in time', required: false })
  @IsDateString()
  @IsOptional()
  checkIn?: string;

  @ApiProperty({ description: 'Check-out time', required: false })
  @IsDateString()
  @IsOptional()
  checkOut?: string;

  @ApiProperty({
    description: 'Check-in source',
    enum: CheckSource,
    required: false,
  })
  @IsEnum(CheckSource)
  @IsOptional()
  checkInSource?: CheckSource;

  @ApiProperty({
    description: 'Check-out source',
    enum: CheckSource,
    required: false,
  })
  @IsEnum(CheckSource)
  @IsOptional()
  checkOutSource?: CheckSource;

  @ApiProperty({ description: 'Break minutes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  breakMinutes?: number;

  @ApiProperty({
    description: 'Whether the shift is overnight',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isOvernight?: boolean;

  @ApiProperty({ description: 'Timezone', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateAttendanceRecordDto {
  @ApiProperty({
    description: 'Attendance status',
    enum: AttendanceStatus,
    required: false,
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiProperty({ description: 'Check-in time', required: false })
  @IsDateString()
  @IsOptional()
  checkIn?: string;

  @ApiProperty({ description: 'Check-out time', required: false })
  @IsDateString()
  @IsOptional()
  checkOut?: string;

  @ApiProperty({
    description: 'Check-in source',
    enum: CheckSource,
    required: false,
  })
  @IsEnum(CheckSource)
  @IsOptional()
  checkInSource?: CheckSource;

  @ApiProperty({
    description: 'Check-out source',
    enum: CheckSource,
    required: false,
  })
  @IsEnum(CheckSource)
  @IsOptional()
  checkOutSource?: CheckSource;

  @ApiProperty({ description: 'Break minutes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  breakMinutes?: number;

  @ApiProperty({ description: 'Overtime minutes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  overtimeMinutes?: number;

  @ApiProperty({ description: 'Late minutes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  lateMinutes?: number;

  @ApiProperty({ description: 'Early departure minutes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  earlyDepartureMinutes?: number;

  @ApiProperty({
    description: 'Whether the shift is overnight',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isOvernight?: boolean;

  @ApiProperty({ description: 'Timezone', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class QueryAttendanceDto extends PaginationDto {
  @ApiProperty({ description: 'Filter by employee ID', required: false })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({
    description: 'Filter by status',
    enum: AttendanceStatus,
    required: false,
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiProperty({
    description: 'Filter by start date',
    required: false,
    example: '2026-04-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Filter by end date',
    required: false,
    example: '2026-04-30',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
