import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OvertimeStatus, CompensationType } from '../enums/overtime.enums';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class CreateOvertimeRequestDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Overtime date', example: '2026-04-01' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Planned overtime minutes' })
  @IsInt()
  @Min(1)
  plannedMinutes: number;

  @ApiProperty({ description: 'Reason for overtime' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Compensation type', enum: CompensationType })
  @IsEnum(CompensationType)
  compensationType: CompensationType;
}

export class ReviewOvertimeRequestDto {
  @ApiProperty({ description: 'Actual overtime minutes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  actualMinutes?: number;

  @ApiProperty({ description: 'Review notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryOvertimeDto extends PaginationDto {
  @ApiProperty({ description: 'Filter by employee ID', required: false })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({
    description: 'Filter by status',
    enum: OvertimeStatus,
    required: false,
  })
  @IsEnum(OvertimeStatus)
  @IsOptional()
  status?: OvertimeStatus;
}
