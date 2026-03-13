import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePicklistDto } from './create-picklist.dto';
import { CreatePicklistOptionDto } from './create-picklist-option.dto';

export class UpdatePicklistDto extends PartialType(CreatePicklistDto) {
  @ApiProperty({
    description: 'Full replacement of options (delete-recreate)',
    required: false,
    type: [CreatePicklistOptionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePicklistOptionDto)
  options?: CreatePicklistOptionDto[];
}
