import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmploymentType } from '../enums/employment-type.enum';

export class CreateEmployeeJobInformationDto {
  @ApiProperty({
    description: 'Effective date of this job assignment',
    example: '2023-01-15',
  })
  @IsDateString()
  effectiveDate: string;

  @ApiProperty({
    description: 'End date of this job assignment',
    example: '2024-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Job title for this assignment',
    example: 'Senior Software Engineer',
  })
  @IsString()
  jobTitle: string;

  @ApiProperty({
    description: 'Department for this assignment',
    example: 'Engineering',
    required: false,
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({
    description: 'Work location for this assignment',
    example: 'New York Office',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Employment type',
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiProperty({
    description: 'ID of the reporting manager',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  managerId?: string;

  @ApiProperty({
    description: 'Additional notes about this job assignment',
    example: 'Promoted from mid-level position',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
