import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsInt,
  IsDateString,
  IsObject,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  GrantStrategy,
  GrantTrigger,
  RelativeAnchor,
  CarryoverStrategy,
  ExpiryStrategy,
  RecurringPattern,
  ConsumptionStrategy,
} from '../enums/leave.enums';

export class LeavePolicyTranslationDto {
  @ApiProperty({ description: 'Localized name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Localized description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateEntitlementRuleDto {
  @ApiProperty({ description: 'Rule name', example: '14 days yearly' })
  @IsString()
  name: string;

  @ApiProperty({ enum: GrantStrategy })
  @IsEnum(GrantStrategy)
  grantStrategy: GrantStrategy;

  @ApiProperty({ example: 14 })
  @IsNumber()
  @Min(0)
  grantAmount: number;

  @ApiProperty({ enum: GrantTrigger })
  @IsEnum(GrantTrigger)
  grantTrigger: GrantTrigger;

  @ApiProperty({ enum: RelativeAnchor, required: false })
  @IsEnum(RelativeAnchor)
  @IsOptional()
  relativeAnchor?: RelativeAnchor;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  relativeStartOffsetDays?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  relativeEndOffsetDays?: number;

  @ApiProperty({ enum: RecurringPattern, required: false })
  @IsEnum(RecurringPattern)
  @IsOptional()
  recurringPattern?: RecurringPattern;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  maxGrantsPerEmployee?: number;

  @ApiProperty({ enum: CarryoverStrategy, required: false })
  @IsEnum(CarryoverStrategy)
  @IsOptional()
  carryoverStrategy?: CarryoverStrategy;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  carryoverMaxDays?: number;

  @ApiProperty({ enum: ExpiryStrategy, required: false })
  @IsEnum(ExpiryStrategy)
  @IsOptional()
  expiryStrategy?: ExpiryStrategy;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  expiryDays?: number;

  @ApiProperty({ enum: ConsumptionStrategy, required: false })
  @IsEnum(ConsumptionStrategy)
  @IsOptional()
  consumptionStrategy?: ConsumptionStrategy;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  allowNegativeBalance?: boolean;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateLeavePolicyDto {
  @ApiProperty({ description: 'Leave type ID' })
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty({ description: 'Unique code', example: 'standard_annual' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Policy name', example: 'Standard Annual Leave Policy' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  priority?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  effectiveStartDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  effectiveEndDate?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Translations keyed by locale',
    required: false,
  })
  @IsObject()
  @IsOptional()
  translations?: Record<string, LeavePolicyTranslationDto>;

  @ApiProperty({ type: [CreateEntitlementRuleDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEntitlementRuleDto)
  @IsOptional()
  entitlementRules?: CreateEntitlementRuleDto[];
}

export class UpdateLeavePolicyDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  translations?: Record<string, LeavePolicyTranslationDto>;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  priority?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  effectiveStartDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  effectiveEndDate?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ type: [CreateEntitlementRuleDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEntitlementRuleDto)
  @IsOptional()
  entitlementRules?: CreateEntitlementRuleDto[];
}
