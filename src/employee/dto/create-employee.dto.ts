import { IsArray, IsDateString, IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeEducationDto {
  @ApiProperty({
    description: 'Education institution',
    example: 'Harvard University'
  })
  @IsString()
  institution: string;

  @ApiProperty({
    description: 'Degree obtained',
    example: 'Bachelor of Science'
  })
  @IsString()
  degree: string;

  @ApiProperty({
    description: 'Field of study',
    example: 'Computer Science',
    required: false
  })
  @IsString()
  @IsOptional()
  fieldOfStudy?: string;

  @ApiProperty({
    description: 'Start date of education',
    example: '2015-09-01',
    required: false
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date of education',
    example: '2019-06-30',
    required: false
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Description of education',
    example: 'Graduated with honors',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'First name of the employee',
    example: 'John'
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the employee',
    example: 'Doe'
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the employee',
    example: 'john.doe@example.com',
    required: false
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Phone number of the employee',
    example: '+1234567890',
    required: false
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Job position of the employee',
    example: 'Software Engineer',
    required: false
  })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({
    description: 'Department of the employee',
    example: 'Engineering',
    required: false
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({
    description: 'Date when the employee was hired',
    example: '2020-01-15',
    required: false
  })
  @IsDateString()
  @IsOptional()
  hireDate?: string;

  @ApiProperty({
    description: 'Educational background of the employee',
    type: [CreateEmployeeEducationDto],
    required: false,
    example: [{
      institution: 'Harvard University',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2015-09-01',
      endDate: '2019-06-30',
      description: 'Graduated with honors'
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeEducationDto)
  @IsOptional()
  educations?: CreateEmployeeEducationDto[];
} 