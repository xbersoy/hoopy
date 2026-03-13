import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrgUnitTypeTranslationDto } from './org-unit-type-translation.dto';

export class CreateOrgUnitTypeDto {
  @ApiProperty({
    description: 'URL-friendly slug, unique per company',
    example: 'department',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiProperty({
    description: 'Optional color for UI',
    example: '#3B82F6',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiProperty({
    description: 'Optional icon identifier',
    example: 'building',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiProperty({
    description:
      'Translations keyed by BCP-47 locale. At least one locale required.',
    example: {
      en: { name: 'Department' },
      tr: { name: 'Departman', shortName: 'Dept' },
    },
  })
  @IsObject()
  @IsNotEmpty()
  translations: Record<string, OrgUnitTypeTranslationDto>;
}
