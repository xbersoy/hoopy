import {
  IsArray,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateEmployeeEmergencyContactDto } from './create-employee-emergency-contact.dto';
import { CreateEmployeeDependentDto } from './create-employee-dependent.dto';
import { CreateEmployeeWorkExperienceDto } from './create-employee-work-experience.dto';
import { CreateEmployeeJobInformationDto } from './create-employee-job-information.dto';
import { CreateEmployeeLicenseCertificationDto } from './create-employee-license-certification.dto';
import { CreateEmployeeNationalIdDto } from './create-employee-national-id.dto';

export class CreateEmployeeEducationDto {
  @ApiProperty({
    description: 'Education institution',
    example: 'Harvard University',
  })
  @IsString()
  institution: string;

  @ApiProperty({
    description: 'Degree obtained',
    example: 'Bachelor of Science',
  })
  @IsString()
  degree: string;

  @ApiProperty({
    description: 'Field of study',
    example: 'Computer Science',
    required: false,
  })
  @IsString()
  @IsOptional()
  fieldOfStudy?: string;

  @ApiProperty({
    description: 'Start date of education',
    example: '2015-09-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date of education',
    example: '2019-06-30',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Description of education',
    example: 'Graduated with honors',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'First name of the employee',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the employee',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the employee',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Phone number of the employee',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Job position of the employee',
    example: 'Software Engineer',
    required: false,
  })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({
    description: 'Department of the employee',
    example: 'Engineering',
    required: false,
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({
    description: 'Date when the employee was hired',
    example: '2020-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  hireDate?: string;

  @ApiProperty({
    description: 'Educational background of the employee',
    type: [CreateEmployeeEducationDto],
    required: false,
    example: [
      {
        institution: 'Harvard University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2015-09-01',
        endDate: '2019-06-30',
        description: 'Graduated with honors',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeEducationDto)
  @IsOptional()
  educations?: CreateEmployeeEducationDto[];

  @ApiProperty({
    description: 'Emergency contacts of the employee',
    type: [CreateEmployeeEmergencyContactDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeEmergencyContactDto)
  @IsOptional()
  emergencyContacts?: CreateEmployeeEmergencyContactDto[];

  @ApiProperty({
    description: 'Dependents of the employee',
    type: [CreateEmployeeDependentDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeDependentDto)
  @IsOptional()
  dependents?: CreateEmployeeDependentDto[];

  @ApiProperty({
    description: 'Work experiences of the employee',
    type: [CreateEmployeeWorkExperienceDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeWorkExperienceDto)
  @IsOptional()
  workExperiences?: CreateEmployeeWorkExperienceDto[];

  @ApiProperty({
    description: 'Job information history of the employee',
    type: [CreateEmployeeJobInformationDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeJobInformationDto)
  @IsOptional()
  jobInformations?: CreateEmployeeJobInformationDto[];

  @ApiProperty({
    description: 'Licenses and certifications of the employee',
    type: [CreateEmployeeLicenseCertificationDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeLicenseCertificationDto)
  @IsOptional()
  licensesCertifications?: CreateEmployeeLicenseCertificationDto[];

  @ApiProperty({
    description: 'National IDs of the employee',
    type: [CreateEmployeeNationalIdDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeNationalIdDto)
  @IsOptional()
  nationalIds?: CreateEmployeeNationalIdDto[];

  @ApiProperty({
    description: 'ID of the user linked to this employee',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'ID of the company this employee belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  companyId?: string;
}
