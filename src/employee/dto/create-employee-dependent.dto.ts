import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Relationship } from '../enums/relationship.enum';
import { Gender } from '../enums/gender.enum';

export class CreateEmployeeDependentDto {
  @ApiProperty({
    description: 'Full name of the dependent',
    example: 'John Doe Jr.',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Relationship to the employee',
    enum: Relationship,
    example: Relationship.CHILD,
  })
  @IsEnum(Relationship)
  relationship: Relationship;

  @ApiProperty({
    description: 'Date of birth of the dependent',
    example: '2010-05-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender of the dependent',
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({
    description: 'National ID of the dependent',
    example: '12345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  nationalId?: string;
}
