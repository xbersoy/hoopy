import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitSurveyAnswerDto {
  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  textValue?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  numericValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  selectedOptionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selectedOptionIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  booleanValue?: boolean;
}

export class SubmitSurveyResponseDto {
  @ApiProperty({ type: [SubmitSurveyAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitSurveyAnswerDto)
  answers: SubmitSurveyAnswerDto[];

  @ApiProperty({ required: false, description: 'Save as draft (do not submit)' })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}

export class QueryMySurveysDto {
  @ApiProperty({ required: false })
  @IsOptional()
  status?: 'pending' | 'completed' | 'all';

  @ApiProperty({ required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: number;
}
