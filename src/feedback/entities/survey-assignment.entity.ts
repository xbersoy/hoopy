import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Survey } from './survey.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { SurveyResponseStatus } from '../enums';

@Entity('survey_assignments')
@Index('IDX_survey_assignment_survey', ['surveyId'])
@Index('IDX_survey_assignment_employee', ['employeeId'])
@Index('IDX_survey_assignment_status', ['surveyId', 'status'])
@Unique('UQ_survey_assignment_survey_employee', ['surveyId', 'employeeId'])
export class SurveyAssignment {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Survey, (s) => s.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({ description: 'Response status' })
  @Column({ type: 'varchar', length: 20, default: SurveyResponseStatus.NOT_STARTED })
  status: SurveyResponseStatus;

  @ApiProperty({ description: 'Whether employee has completed (for anonymous tracking)' })
  @Column({ type: 'boolean', default: false })
  hasCompleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastReminderAt: Date | null;

  @Column({ type: 'int', default: 0 })
  reminderCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
