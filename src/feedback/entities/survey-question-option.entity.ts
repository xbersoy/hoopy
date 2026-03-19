import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SurveyQuestion } from './survey-question.entity';

@Entity('survey_question_options')
@Index('IDX_survey_question_option_question', ['questionId'])
export class SurveyQuestionOption {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @ManyToOne(() => SurveyQuestion, (q) => q.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestion;

  @ApiProperty({ description: 'Option value' })
  @Column({ type: 'varchar', length: 255 })
  value: string;

  @ApiProperty({ description: 'Display label' })
  @Column({ type: 'varchar', length: 255 })
  label: string;

  @ApiProperty({ description: 'Sort order' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
