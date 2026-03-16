import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  MaxLength,
  IsNumber,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PicklistOptionTranslationDto } from './picklist-option-translation.dto';

export class CreatePicklistOptionDto {
  @ApiProperty({
    description: 'Unique string code for the picklist option',
    example: 'engineering',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @ApiProperty({
    description: 'Sort order for displaying options',
    example: 10,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({
    description: 'Whether the option is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Translations keyed by locale',
    example: {
      en: { label: 'Engineering' },
      tr: { label: 'Mühendislik' },
    },
  })
  @IsObject()
  @IsNotEmpty()
  translations: Record<string, PicklistOptionTranslationDto>;
}
