import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompetencyCategoryDto {
  @ApiProperty({
    description: 'Optional code/slug for the competency category',
    example: 'BEHAVIORAL',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Name of the competency category',
    example: 'Behavioral',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the competency category',
    example: 'Competencies related to workplace behaviors and interpersonal skills',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the competency category is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Sort order for display purposes',
    example: 1,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class UpdateCompetencyCategoryDto {
  @ApiProperty({
    description: 'Optional code/slug for the competency category',
    example: 'BEHAVIORAL',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Name of the competency category',
    example: 'Behavioral',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the competency category',
    example: 'Competencies related to workplace behaviors and interpersonal skills',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the competency category is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Sort order for display purposes',
    example: 1,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
