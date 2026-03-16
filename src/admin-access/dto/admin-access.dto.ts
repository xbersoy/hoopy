import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
} from 'class-validator';

const VALID_PRIVILEGES = ['permission-management', 'account-management'];

export class GrantAdminAccessDto {
  @ApiProperty({ description: 'User ID to grant access', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Administrative privileges to grant',
    example: ['permission-management'],
  })
  @IsArray()
  @IsIn(VALID_PRIVILEGES, { each: true })
  privileges: string[];
}

export class UpdateAdminAccessDto {
  @ApiProperty({
    description: 'Updated privileges',
    example: ['permission-management', 'account-management'],
  })
  @IsArray()
  @IsOptional()
  @IsIn(VALID_PRIVILEGES, { each: true })
  privileges?: string[];
}
