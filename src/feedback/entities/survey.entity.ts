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
import { Company } from '../../company/entities/company.entity';
import { User } from '../../user/entities/user.entity';
import { SurveyTemplate } from './survey-template.entity';
import { SurveyQuestion } from './survey-question.entity';
import { SurveyAssignment } from './survey-assignment.entity';
import { SurveyStatus, SurveyRecurrence, AudienceTargetType } from '../enums';

@Entity('surveys')
@Index('IDX_survey_company_status', ['companyId', 'status'])
@Index('IDX_survey_published_at', ['companyId', 'publishedAt'])
export class Survey {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ description: 'Survey title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Survey description/instructions' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Survey status' })
  @Column({ type: 'varchar', length: 20, default: SurveyStatus.DRAFT })
  status: SurveyStatus;

  @ApiProperty({ description: 'Template ID if created from template' })
  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @ManyToOne(() => SurveyTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: SurveyTemplate | null;

  @ApiProperty({ description: 'Whether responses are anonymous' })
  @Column({ type: 'boolean', default: true })
  isAnonymous: boolean;

  @ApiProperty({ description: 'Whether participation is mandatory' })
  @Column({ type: 'boolean', default: false })
  isMandatory: boolean;

  @ApiProperty({ description: 'Whether responses can be edited until due date' })
  @Column({ type: 'boolean', default: false })
  allowEditUntilDue: boolean;

  @ApiProperty({ description: 'Scheduled publish date' })
  @Column({ type: 'timestamptz', nullable: true })
  scheduledPublishAt: Date | null;

  @ApiProperty({ description: 'Actual published date' })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ description: 'Start date for accepting responses' })
  @Column({ type: 'date', nullable: true })
  startDate: Date | null;

  @ApiProperty({ description: 'Due date' })
  @Column({ type: 'date', nullable: true })
  dueDate: Date | null;

  @ApiProperty({ description: 'Close date' })
  @Column({ type: 'date', nullable: true })
  closeDate: Date | null;

  @ApiProperty({ description: 'Recurrence pattern' })
  @Column({ type: 'varchar', length: 20, default: SurveyRecurrence.ONCE })
  recurrence: SurveyRecurrence;

  @ApiProperty({ description: 'Audience target type' })
  @Column({ type: 'varchar', length: 30 })
  audienceType: AudienceTargetType;

  @ApiProperty({ description: 'Audience target configuration' })
  @Column({ type: 'jsonb', nullable: true })
  audienceConfig: Record<string, any> | null;

  @ApiProperty({ description: 'Reminder settings' })
  @Column({ type: 'jsonb', nullable: true })
  reminderSettings: Record<string, any> | null;

  @ApiProperty({ description: 'Minimum responses for analytics (anonymity threshold)' })
  @Column({ type: 'int', default: 5 })
  anonymityThreshold: number;

  @ApiProperty({ description: 'Created by user ID' })
  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @OneToMany(() => SurveyQuestion, (q) => q.survey, { cascade: true })
  questions: SurveyQuestion[];

  @OneToMany(() => SurveyAssignment, (a) => a.survey, { cascade: true })
  assignments: SurveyAssignment[];

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
