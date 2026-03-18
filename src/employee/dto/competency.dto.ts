import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompetencyDto {
  @ApiProperty({
    description: 'Optional code/slug for the competency',
    example: 'LEADERSHIP',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Name of the competency',
    example: 'Leadership',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the competency',
    example: 'Ability to lead and inspire teams',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Competency category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  competencyCategoryId?: string;

  @ApiProperty({
    description: 'Category of the competency (legacy text field)',
    example: 'Behavioral',
    required: false,
    deprecated: true,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Whether the competency is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCompetencyDto {
  @ApiProperty({
    description: 'Optional code/slug for the competency',
    example: 'LEADERSHIP',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Name of the competency',
    example: 'Leadership',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the competency',
    example: 'Ability to lead and inspire teams',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Competency category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  competencyCategoryId?: string;

  @ApiProperty({
    description: 'Category of the competency (legacy text field)',
    example: 'Behavioral',
    required: false,
    deprecated: true,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Whether the competency is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
