import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StateMachineCategory } from '../enums/state-machine.enums';

// ─── I18n DTO ───

export class I18nTranslationDto {
  @ApiProperty({ description: 'BCP-47 locale', example: 'en' })
  @IsString()
  locale: string;

  @ApiProperty({ description: 'Localized name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Localized description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

// ─── State DTO ───

export class CreateStateMachineStateDto {
  @ApiProperty({ description: 'Stable state code', example: 'pending_approval' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Whether this is the initial state', required: false })
  @IsBoolean()
  @IsOptional()
  isInitial?: boolean;

  @ApiProperty({ description: 'Whether this is a terminal state', required: false })
  @IsBoolean()
  @IsOptional()
  isFinal?: boolean;

  @ApiProperty({ description: 'Sort order', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ description: 'Color hint for UI', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Icon hint for UI', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Translations', type: [I18nTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => I18nTranslationDto)
  translations: I18nTranslationDto[];
}

// ─── Transition DTO ───

export class CreateStateMachineTransitionDto {
  @ApiProperty({ description: 'Stable transition code', example: 'submit' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Code of the source state', example: 'draft' })
  @IsString()
  fromStateCode: string;

  @ApiProperty({ description: 'Code of the target state', example: 'pending_approval' })
  @IsString()
  toStateCode: string;

  @ApiProperty({ description: 'Guard condition (JSON DSL)', required: false })
  @IsObject()
  @IsOptional()
  guardCondition?: Record<string, any>;

  @ApiProperty({ description: 'Priority (lower = first)', required: false })
  @IsInt()
  @IsOptional()
  priority?: number;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Translations', type: [I18nTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => I18nTranslationDto)
  translations: I18nTranslationDto[];
}

// ─── Definition DTO ───

export class CreateStateMachineDefinitionDto {
  @ApiProperty({ description: 'Stable machine-readable code', example: 'leave_request_lifecycle' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Target resource type', example: 'leave_request' })
  @IsString()
  resourceType: string;

  @ApiProperty({ description: 'Category', enum: StateMachineCategory, required: false })
  @IsEnum(StateMachineCategory)
  @IsOptional()
  category?: StateMachineCategory;

  @ApiProperty({ description: 'Code of the initial state', example: 'draft' })
  @IsString()
  initialStateCode: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Definition translations', type: [I18nTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => I18nTranslationDto)
  translations: I18nTranslationDto[];

  @ApiProperty({ description: 'States', type: [CreateStateMachineStateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStateMachineStateDto)
  states: CreateStateMachineStateDto[];

  @ApiProperty({ description: 'Transitions', type: [CreateStateMachineTransitionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStateMachineTransitionDto)
  transitions: CreateStateMachineTransitionDto[];
}

// ─── Instance DTO ───

export class CreateStateMachineInstanceDto {
  @ApiProperty({ description: 'Definition ID to instantiate' })
  @IsString()
  definitionId: string;

  @ApiProperty({ description: 'Resource type', example: 'leave_request' })
  @IsString()
  resourceType: string;

  @ApiProperty({ description: 'Resource ID' })
  @IsString()
  resourceId: string;

  @ApiProperty({ description: 'Initial context data', required: false })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ExecuteTransitionDto {
  @ApiProperty({ description: 'Transition code to execute', example: 'submit' })
  @IsString()
  transitionCode: string;

  @ApiProperty({ description: 'Comment for this transition', required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ description: 'Additional context for guard evaluation', required: false })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
