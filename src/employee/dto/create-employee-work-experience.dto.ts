import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeWorkExperienceDto {
  @ApiProperty({
    description: 'Name of the company',
    example: 'Acme Corp',
  })
  @IsString()
  companyName: string;

  @ApiProperty({
    description: 'Job title held at the company',
    example: 'Senior Software Engineer',
  })
  @IsString()
  jobTitle: string;

  @ApiProperty({
    description: 'Start date of employment',
    example: '2018-01-15',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date of employment',
    example: '2022-06-30',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Location of the company',
    example: 'San Francisco, CA',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Description of responsibilities and achievements',
    example: 'Led a team of 5 engineers building microservices',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Reason for leaving the company',
    example: 'Career growth opportunity',
    required: false,
  })
  @IsString()
  @IsOptional()
  reasonForLeaving?: string;
}
