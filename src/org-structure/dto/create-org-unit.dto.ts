import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrgUnitDto {
  @ApiProperty({ description: 'Name of the org unit', example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Parent org unit ID (omit for root)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ description: 'Org unit type ID', required: false })
  @IsOptional()
  @IsUUID()
  typeId?: string;

  @ApiProperty({ description: 'Short code', example: 'ENG', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Display order among siblings', required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
