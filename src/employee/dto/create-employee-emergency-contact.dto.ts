import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Relationship } from '../enums/relationship.enum';

export class CreateEmployeeEmergencyContactDto {
  @ApiProperty({
    description: 'Full name of the emergency contact',
    example: 'Jane Doe',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Relationship to the employee',
    enum: Relationship,
    example: Relationship.SPOUSE,
  })
  @IsEnum(Relationship)
  relationship: Relationship;

  @ApiProperty({
    description: 'Phone number of the emergency contact',
    example: '+1234567890',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Email address of the emergency contact',
    example: 'jane.doe@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Address of the emergency contact',
    example: '123 Main St, Springfield, IL',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Whether this is the primary emergency contact',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
