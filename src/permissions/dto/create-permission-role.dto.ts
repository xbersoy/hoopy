import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreatePermissionRoleDto {
  @ApiProperty({ description: 'Role name', example: 'HR Manager' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Role description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Permission IDs to assign',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

export class UpdatePermissionRoleDto extends PartialType(
  CreatePermissionRoleDto,
) {}
