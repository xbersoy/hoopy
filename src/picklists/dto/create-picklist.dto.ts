import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PicklistTranslationDto } from './picklist-translation.dto';
import { CreatePicklistOptionDto } from './create-picklist-option.dto';

export class CreatePicklistDto {
  @ApiProperty({
    description: 'Unique string code for the picklist',
    example: 'departments',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @ApiProperty({
    description: 'Whether the picklist is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Translations keyed by BCP-47 locale. At least one locale required.',
    example: {
      en: { name: 'Departments' },
      tr: { name: 'Departmanlar' },
    },
  })
  @IsObject()
  @IsNotEmpty()
  translations: Record<string, PicklistTranslationDto>;

  @ApiProperty({
    description: 'Options to create along with the picklist',
    required: false,
    type: [CreatePicklistOptionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePicklistOptionDto)
  options?: CreatePicklistOptionDto[];
}
