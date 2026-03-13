import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCustomObjectDefinitionDto } from './create-custom-object-definition.dto';
import { CreateCustomObjectFieldDto } from './create-custom-object-field.dto';

export class UpdateCustomObjectDefinitionDto extends PartialType(
  CreateCustomObjectDefinitionDto,
) {
  @ApiProperty({
    description: 'Replacement field definitions (replaces all existing fields)',
    type: [CreateCustomObjectFieldDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomObjectFieldDto)
  @IsOptional()
  declare fields?: CreateCustomObjectFieldDto[];
}
