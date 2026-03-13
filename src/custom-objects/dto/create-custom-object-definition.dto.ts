import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsArray,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCustomObjectFieldDto } from './create-custom-object-field.dto';

export class CustomObjectDefinitionTranslationDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  pluralName?: string;
}

export class CreateCustomObjectDefinitionDto {
  @ApiProperty({
    description: 'Unique code within the company',
    example: 'vehicle_assignment',
  })
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({ description: 'Display name', example: 'Vehicle Assignment' })
  @IsString()
  @MaxLength(255)
  label: string;

  @ApiProperty({
    description: 'Description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Base object type this entity is scoped to',
    required: false,
    example: 'EMPLOYEE',
    enum: ['EMPLOYEE', 'POSITION'],
  })
  @IsString()
  @IsOptional()
  baseObjectType?: string;

  @ApiProperty({
    description: 'Whether this object is active',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Field definitions',
    type: [CreateCustomObjectFieldDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomObjectFieldDto)
  @IsOptional()
  fields?: CreateCustomObjectFieldDto[];

  @ApiProperty({
    description: 'Locale-specific translations (e.g. { "tr": { "name": "Araç Ataması", "pluralName": "Araç Atamaları" } })',
    required: false,
    example: { tr: { name: 'Araç Ataması', pluralName: 'Araç Atamaları' } },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomObjectDefinitionTranslationDto)
  translations?: Record<string, CustomObjectDefinitionTranslationDto>;
}
