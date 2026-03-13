import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  IsArray,
  IsOptional,
  MaxLength,
  Min,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomFieldType } from '../enums/custom-field-type.enum';

export class CustomObjectFieldTranslationDto {
  @IsString()
  @MaxLength(255)
  label: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCustomObjectFieldDto {
  @ApiProperty({ description: 'Unique field code', example: 'vehicle_id' })
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({ description: 'Display label', example: 'Vehicle ID' })
  @IsString()
  @MaxLength(255)
  label: string;

  @ApiProperty({ description: 'Field description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Data type',
    enum: CustomFieldType,
    example: CustomFieldType.STRING,
  })
  @IsEnum(CustomFieldType)
  dataType: CustomFieldType;

  @ApiProperty({ description: 'Whether this field is required', required: false })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({
    description: 'Field visibility mode',
    required: false,
    default: 'EDIT',
    enum: ['EDIT', 'READ', 'HIDE'],
  })
  @IsString()
  @IsOptional()
  visibility?: string;

  @ApiProperty({ description: 'Sort order', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({
    description: 'Options for SELECT type',
    required: false,
    example: ['Option A', 'Option B'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiProperty({ description: 'Picklist ID for PICKLIST type', required: false })
  @IsUUID()
  @IsOptional()
  picklistId?: string;

  @ApiProperty({ description: 'Referenced Definition ID for CUSTOM_OBJECT type', required: false })
  @IsUUID()
  @IsOptional()
  referencedDefinitionId?: string;

  @ApiProperty({
    description: 'Locale-specific translations (e.g. { "tr": { "label": "Araç ID" } })',
    required: false,
    example: { tr: { label: 'Araç ID' } },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomObjectFieldTranslationDto)
  translations?: Record<string, CustomObjectFieldTranslationDto>;
}
