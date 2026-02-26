import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ContactType } from '../entities/contact.entity';

export class CreateContactDto {
  @ApiProperty({
    description: 'Type of contact',
    enum: ContactType,
    example: ContactType.EMAIL
  })
  @IsEnum(ContactType)
  @IsNotEmpty()
  type: ContactType;

  @ApiProperty({
    description: 'Contact value (e.g., email address or phone number)',
    example: 'john@example.com'
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    description: 'Optional label for the contact (e.g., "work", "personal")',
    example: 'work',
    required: false
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({
    description: 'Whether this is the primary contact of its type',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
} 