import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkAuthorizationType } from '../enums/work-authorization-type.enum';
import { WorkAuthorizationStatus } from '../enums/work-authorization-status.enum';

export class CreateEmployeeWorkAuthorizationDto {
  @ApiProperty({
    description: 'Type of work authorization',
    enum: WorkAuthorizationType,
    example: WorkAuthorizationType.WORK_VISA,
  })
  @IsEnum(WorkAuthorizationType)
  authorizationType: WorkAuthorizationType;

  @ApiProperty({
    description: 'Current status of the work authorization',
    enum: WorkAuthorizationStatus,
    example: WorkAuthorizationStatus.ACTIVE,
    required: false,
  })
  @IsEnum(WorkAuthorizationStatus)
  @IsOptional()
  status?: WorkAuthorizationStatus;

  @ApiProperty({
    description: 'Document or authorization number',
    example: 'A123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiProperty({
    description: 'Country that issued the authorization',
    example: 'United States',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Date when the authorization was issued',
    example: '2022-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiProperty({
    description: 'Date when the authorization expires',
    example: '2025-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({
    description: 'Authority that issued the authorization',
    example: 'USCIS',
    required: false,
  })
  @IsString()
  @IsOptional()
  issuingAuthority?: string;

  @ApiProperty({
    description: 'Additional notes about the work authorization',
    example: 'H-1B visa sponsored by company',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
