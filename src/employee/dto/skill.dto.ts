import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({
    description: 'Skill type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  skillTypeId: string;

  @ApiProperty({
    description: 'Optional code/slug for the skill',
    example: 'TYPESCRIPT',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Name of the skill',
    example: 'TypeScript',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the skill',
    example: 'TypeScript programming language',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the skill is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSkillDto {
  @ApiProperty({
    description: 'Skill type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  skillTypeId?: string;

  @ApiProperty({
    description: 'Optional code/slug for the skill',
    example: 'TYPESCRIPT',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Name of the skill',
    example: 'TypeScript',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the skill',
    example: 'TypeScript programming language',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the skill is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
