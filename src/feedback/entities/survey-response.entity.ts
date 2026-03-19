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
import { Survey } from './survey.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { SurveyAnswer } from './survey-answer.entity';
import { SurveyResponseStatus } from '../enums';

@Entity('survey_responses')
@Index('IDX_survey_response_survey', ['surveyId'])
@Index('IDX_survey_response_respondent', ['respondentId'])
export class SurveyResponse {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @ApiProperty({
    description: 'Respondent employee ID (null for anonymous surveys)',
  })
  @Column({ name: 'respondent_id', type: 'uuid', nullable: true })
  respondentId: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'respondent_id' })
  respondent: Employee | null;

  @ApiProperty({ description: 'Response status' })
  @Column({ type: 'varchar', length: 20, default: SurveyResponseStatus.IN_PROGRESS })
  status: SurveyResponseStatus;

  @OneToMany(() => SurveyAnswer, (a) => a.response, { cascade: true })
  answers: SurveyAnswer[];

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
