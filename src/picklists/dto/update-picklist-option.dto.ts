import { PartialType } from '@nestjs/swagger';
import { CreatePicklistOptionDto } from './create-picklist-option.dto';

export class UpdatePicklistOptionDto extends PartialType(CreatePicklistOptionDto) { }
