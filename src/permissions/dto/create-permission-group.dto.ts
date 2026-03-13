import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

export class CreatePeoplePoolConditionDto {
  @ApiProperty({
    description: 'Employee field to match',
    example: 'department',
  })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({
    description: 'Values to match against',
    example: ['Engineering'],
  })
  @IsArray()
  @IsString({ each: true })
  values: string[];
}

export class CreatePeoplePoolDto {
  @ApiProperty({
    description: 'Pool type',
    enum: ['included', 'excluded'],
  })
  @IsString()
  @IsIn(['included', 'excluded'])
  poolType: 'included' | 'excluded';

  @ApiProperty({ type: [CreatePeoplePoolConditionDto] })
  @ValidateNested({ each: true })
  @Type(() => CreatePeoplePoolConditionDto)
  @IsArray()
  conditions: CreatePeoplePoolConditionDto[];
}

export class CreatePermissionGroupDto {
  @ApiProperty({ description: 'Group name', example: 'Engineering Team' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Group description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Permission role IDs to assign to this group',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionRoleIds?: string[];

  @ApiProperty({
    description: 'User IDs for direct membership',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  memberUserIds?: string[];

  @ApiProperty({
    description: 'People pools for dynamic membership',
    type: [CreatePeoplePoolDto],
    required: false,
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePeoplePoolDto)
  @IsArray()
  @IsOptional()
  peoplePools?: CreatePeoplePoolDto[];
}

export class UpdatePermissionGroupDto extends PartialType(
  CreatePermissionGroupDto,
) {}
