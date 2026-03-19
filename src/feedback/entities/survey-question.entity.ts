import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SurveyTemplate } from './survey-template.entity';
import { Survey } from './survey.entity';
import { SurveyQuestionOption } from './survey-question-option.entity';
import { QuestionType } from '../enums';

@Entity('survey_questions')
@Index('IDX_survey_question_template', ['surveyTemplateId'])
@Index('IDX_survey_question_survey', ['surveyId'])
export class SurveyQuestion {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'survey_template_id', type: 'uuid', nullable: true })
  surveyTemplateId: string | null;

  @ManyToOne(() => SurveyTemplate, (t) => t.questions, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'survey_template_id' })
  surveyTemplate: SurveyTemplate | null;

  @Column({ name: 'survey_id', type: 'uuid', nullable: true })
  surveyId: string | null;

  @ManyToOne(() => Survey, (s) => s.questions, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey | null;

  @ApiProperty({ description: 'Question type' })
  @Column({ type: 'varchar', length: 30 })
  questionType: QuestionType;

  @ApiProperty({ description: 'Question text/label' })
  @Column({ type: 'text' })
  questionText: string;

  @ApiProperty({ description: 'Help text/description' })
  @Column({ type: 'text', nullable: true })
  helpText: string | null;

  @ApiProperty({ description: 'Whether this question is required' })
  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @ApiProperty({ description: 'Sort order within survey' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Section/group name' })
  @Column({ type: 'varchar', length: 200, nullable: true })
  section: string | null;

  @ApiProperty({ description: 'Additional configuration' })
  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any> | null;

  @OneToMany(() => SurveyQuestionOption, (o) => o.question, { cascade: true })
  options: SurveyQuestionOption[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
