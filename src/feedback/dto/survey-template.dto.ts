import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../enums';

export class CreateSurveyQuestionOptionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  value: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  label: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateSurveyQuestionDto {
  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  questionType: QuestionType;

  @ApiProperty()
  @IsString()
  questionText: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  section?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  config?: Record<string, any>;

  @ApiProperty({ required: false, type: [CreateSurveyQuestionOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionOptionDto)
  options?: CreateSurveyQuestionOptionDto[];
}

export class UpdateSurveyQuestionDto {
  @ApiProperty({ required: false, enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  section?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  config?: Record<string, any>;

  @ApiProperty({ required: false, type: [CreateSurveyQuestionOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionOptionDto)
  options?: CreateSurveyQuestionOptionDto[];
}

export class CreateSurveyTemplateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultInstructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  defaultAnonymous?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ required: false, type: [CreateSurveyQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions?: CreateSurveyQuestionDto[];
}

export class UpdateSurveyTemplateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultInstructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  defaultAnonymous?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ required: false, type: [CreateSurveyQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions?: CreateSurveyQuestionDto[];
}
