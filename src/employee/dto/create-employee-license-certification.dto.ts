import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LicenseCertificationType } from '../enums/license-certification-type.enum';

export class CreateEmployeeLicenseCertificationDto {
  @ApiProperty({
    description: 'Name of the license or certification',
    example: 'AWS Solutions Architect',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type of credential',
    enum: LicenseCertificationType,
    example: LicenseCertificationType.CERTIFICATION,
  })
  @IsEnum(LicenseCertificationType)
  type: LicenseCertificationType;

  @ApiProperty({
    description: 'Organization that issued the credential',
    example: 'Amazon Web Services',
    required: false,
  })
  @IsString()
  @IsOptional()
  issuingOrganization?: string;

  @ApiProperty({
    description: 'Date the credential was issued',
    example: '2023-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiProperty({
    description: 'Date the credential expires',
    example: '2026-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({
    description: 'Credential ID or license number',
    example: 'AWS-SAA-C03-12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  credentialId?: string;

  @ApiProperty({
    description: 'Additional description of the credential',
    example: 'Associate level certification for cloud architecture',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
