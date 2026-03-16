import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PicklistOptionTranslationDto {
  @ApiProperty({
    description: 'Localized option label',
    example: 'Engineering',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label: string;
}
