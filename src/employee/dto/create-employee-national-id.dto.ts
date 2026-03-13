import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NationalIdType } from '../enums/national-id-type.enum';

export class CreateEmployeeNationalIdDto {
  @ApiProperty({
    description: 'Type of national identification',
    enum: NationalIdType,
    example: NationalIdType.PASSPORT,
  })
  @IsEnum(NationalIdType)
  idType: NationalIdType;

  @ApiProperty({
    description: 'The identification number',
    example: 'AB1234567',
  })
  @IsString()
  idNumber: string;

  @ApiProperty({
    description: 'Country that issued the ID (ISO country code)',
    example: 'US',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Date the ID was issued',
    example: '2020-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiProperty({
    description: 'Date the ID expires',
    example: '2030-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({
    description: 'Authority that issued the ID',
    example: 'US Department of State',
    required: false,
  })
  @IsString()
  @IsOptional()
  issuingAuthority?: string;
}
