import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SurveyResponse } from './survey-response.entity';
import { SurveyQuestion } from './survey-question.entity';

@Entity('survey_answers')
@Index('IDX_survey_answer_response', ['responseId'])
@Index('IDX_survey_answer_question', ['questionId'])
export class SurveyAnswer {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'response_id', type: 'uuid' })
  responseId: string;

  @ManyToOne(() => SurveyResponse, (r) => r.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponse;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @ManyToOne(() => SurveyQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestion;

  @ApiProperty({ description: 'Text answer for text-type questions' })
  @Column({ type: 'text', nullable: true })
  textValue: string | null;

  @ApiProperty({ description: 'Numeric answer for rating-type questions' })
  @Column({ type: 'int', nullable: true })
  numericValue: number | null;

  @ApiProperty({ description: 'Single selected option ID' })
  @Column({ type: 'uuid', nullable: true })
  selectedOptionId: string | null;

  @ApiProperty({ description: 'Multiple selected option IDs' })
  @Column({ type: 'jsonb', nullable: true })
  selectedOptionIds: string[] | null;

  @ApiProperty({ description: 'Boolean answer for yes/no questions' })
  @Column({ type: 'boolean', nullable: true })
  booleanValue: boolean | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
