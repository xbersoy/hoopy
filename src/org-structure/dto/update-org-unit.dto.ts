import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrgUnitStatus } from '../enums/org-unit-status.enum';

export class UpdateOrgUnitDto {
  @ApiProperty({ description: 'Name of the org unit', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ description: 'Org unit type ID', required: false })
  @IsOptional()
  @IsUUID()
  typeId?: string;

  @ApiProperty({ description: 'Short code', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Status', enum: OrgUnitStatus, required: false })
  @IsOptional()
  @IsEnum(OrgUnitStatus)
  status?: OrgUnitStatus;

  @ApiProperty({ description: 'Display order among siblings', required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
