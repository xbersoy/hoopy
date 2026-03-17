import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TimesheetStatus } from '../enums/timesheet.enums';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class CreateTimesheetPeriodDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Period start date', example: '2026-04-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Period end date', example: '2026-04-15' })
  @IsDateString()
  periodEnd: string;
}

export class CreateTimesheetEntryDto {
  @ApiProperty({ description: 'Entry date', example: '2026-04-01' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Start time', required: false })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: 'End time', required: false })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: 'Worked minutes' })
  @IsInt()
  @Min(0)
  workedMinutes: number;

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

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Project code', required: false })
  @IsString()
  @IsOptional()
  projectCode?: string;

  @ApiProperty({ description: 'Task code', required: false })
  @IsString()
  @IsOptional()
  taskCode?: string;
}

export class UpdateTimesheetPeriodDto {
  @ApiProperty({
    description: 'Timesheet entries',
    required: false,
    type: [CreateTimesheetEntryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimesheetEntryDto)
  @IsOptional()
  entries?: CreateTimesheetEntryDto[];
}

export class QueryTimesheetDto extends PaginationDto {
  @ApiProperty({ description: 'Filter by employee ID', required: false })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({
    description: 'Filter by status',
    enum: TimesheetStatus,
    required: false,
  })
  @IsEnum(TimesheetStatus)
  @IsOptional()
  status?: TimesheetStatus;
}
