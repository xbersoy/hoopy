import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrgUnitTypeTranslationDto {
  @ApiProperty({ description: 'Localized display name', example: 'Department' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Optional short name for compact UI',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shortName?: string;

  @ApiProperty({
    description: 'Optional localized description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
