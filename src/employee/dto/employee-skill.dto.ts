import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProficiencyLevel } from '../enums/proficiency-level.enum';

export class CreateEmployeeSkillDto {
  @ApiProperty({
    description: 'Skill ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  skillId: string;

  @ApiProperty({
    description: 'Proficiency level',
    enum: ProficiencyLevel,
    example: ProficiencyLevel.INTERMEDIATE,
  })
  @IsEnum(ProficiencyLevel)
  proficiencyLevel: ProficiencyLevel;

  @ApiProperty({
    description: 'Years of experience with this skill',
    example: 3.5,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(99)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiProperty({
    description: 'Date when this skill was last used',
    example: '2024-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  lastUsedAt?: string;

  @ApiProperty({
    description: 'Whether this is the primary skill for the employee',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiProperty({
    description: 'Whether this skill has been verified',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({
    description: 'User ID who verified the skill',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  verifiedBy?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Used extensively in project X',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateEmployeeSkillDto {
  @ApiProperty({
    description: 'Proficiency level',
    enum: ProficiencyLevel,
    example: ProficiencyLevel.ADVANCED,
    required: false,
  })
  @IsEnum(ProficiencyLevel)
  @IsOptional()
  proficiencyLevel?: ProficiencyLevel;

  @ApiProperty({
    description: 'Years of experience with this skill',
    example: 4.5,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(99)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiProperty({
    description: 'Date when this skill was last used',
    example: '2024-06-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  lastUsedAt?: string;

  @ApiProperty({
    description: 'Whether this is the primary skill for the employee',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiProperty({
    description: 'Whether this skill has been verified',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({
    description: 'User ID who verified the skill',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  verifiedBy?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Updated after completing advanced training',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
