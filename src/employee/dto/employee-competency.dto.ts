import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssessmentSource } from '../enums/assessment-source.enum';

export class CreateEmployeeCompetencyDto {
  @ApiProperty({
    description: 'Competency ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  competencyId: string;

  @ApiProperty({
    description: 'Rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Source of the assessment',
    enum: AssessmentSource,
    example: AssessmentSource.MANAGER,
  })
  @IsEnum(AssessmentSource)
  assessmentSource: AssessmentSource;

  @ApiProperty({
    description: 'Date when the assessment was made',
    example: '2024-01-15',
  })
  @IsDateString()
  assessedAt: string;

  @ApiProperty({
    description: 'User ID of the assessor',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  assessorUserId?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Demonstrated excellent leadership during Q4 project',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateEmployeeCompetencyDto {
  @ApiProperty({
    description: 'Rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({
    description: 'Source of the assessment',
    enum: AssessmentSource,
    example: AssessmentSource.HR,
    required: false,
  })
  @IsEnum(AssessmentSource)
  @IsOptional()
  assessmentSource?: AssessmentSource;

  @ApiProperty({
    description: 'Date when the assessment was made',
    example: '2024-06-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  assessedAt?: string;

  @ApiProperty({
    description: 'User ID of the assessor',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  assessorUserId?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Updated after performance review',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
