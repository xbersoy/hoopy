import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class CreateEmployeeScheduleDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Schedule template ID' })
  @IsUUID()
  scheduleTemplateId: string;

  @ApiProperty({ description: 'Shift template ID', required: false })
  @IsUUID()
  @IsOptional()
  shiftTemplateId?: string;

  @ApiProperty({ description: 'Effective from date', example: '2026-04-01' })
  @IsDateString()
  effectiveFrom: string;

  @ApiProperty({
    description: 'Effective until date',
    required: false,
    example: '2026-12-31',
  })
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiProperty({ description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateEmployeeScheduleDto {
  @ApiProperty({ description: 'Schedule template ID', required: false })
  @IsUUID()
  @IsOptional()
  scheduleTemplateId?: string;

  @ApiProperty({ description: 'Shift template ID', required: false })
  @IsUUID()
  @IsOptional()
  shiftTemplateId?: string;

  @ApiProperty({ description: 'Effective from date', required: false })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiProperty({ description: 'Effective until date', required: false })
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiProperty({
    description: 'Whether the assignment is active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryEmployeeScheduleDto extends PaginationDto {
  @ApiProperty({ description: 'Filter by employee ID', required: false })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({
    description: 'Filter by schedule template ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  scheduleTemplateId?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
