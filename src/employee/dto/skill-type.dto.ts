import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSkillTypeDto {
  @ApiProperty({
    description: 'Optional code/slug for the skill type',
    example: 'TECH',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Name of the skill type',
    example: 'Technical',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the skill type',
    example: 'Technical and engineering skills',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the skill type is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Sort order for display',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateSkillTypeDto {
  @ApiProperty({
    description: 'Optional code/slug for the skill type',
    example: 'TECH',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Name of the skill type',
    example: 'Technical',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the skill type',
    example: 'Technical and engineering skills',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the skill type is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Sort order for display',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
