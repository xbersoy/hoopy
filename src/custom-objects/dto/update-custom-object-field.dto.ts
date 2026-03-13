import { PartialType } from '@nestjs/swagger';
import { CreateCustomObjectFieldDto } from './create-custom-object-field.dto';

export class UpdateCustomObjectFieldDto extends PartialType(
  CreateCustomObjectFieldDto,
) {}
