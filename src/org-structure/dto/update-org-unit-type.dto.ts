import { IsString, IsOptional, MaxLength, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrgUnitTypeTranslationDto } from './org-unit-type-translation.dto';

export class UpdateOrgUnitTypeDto {
  @ApiProperty({ description: 'URL-friendly slug', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({ description: 'Optional color for UI', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiProperty({ description: 'Optional icon identifier', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiProperty({
    description: 'Translations to upsert, keyed by BCP-47 locale',
    required: false,
    example: { tr: { name: 'Departman' } },
  })
  @IsOptional()
  @IsObject()
  translations?: Record<string, OrgUnitTypeTranslationDto>;
}
