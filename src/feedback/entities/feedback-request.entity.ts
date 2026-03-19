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
import { FeedbackCategory } from './feedback-category.entity';
import { FeedbackRequestTemplate } from './feedback-request-template.entity';
import { FeedbackRequestAssignment } from './feedback-request-assignment.entity';
import {
  FeedbackRequestStatus,
  FeedbackSubmissionMode,
  AudienceTargetType,
} from '../enums';

@Entity('feedback_requests')
@Index('IDX_feedback_request_company_status', ['companyId', 'status'])
@Index('IDX_feedback_request_due_date', ['companyId', 'dueDate'])
export class FeedbackRequest {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ description: 'Request title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Instructions for employees' })
  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @ApiProperty({ description: 'Category ID' })
  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => FeedbackCategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: FeedbackCategory | null;

  @ApiProperty({ description: 'Template ID' })
  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @ManyToOne(() => FeedbackRequestTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: FeedbackRequestTemplate | null;

  @ApiProperty({ description: 'Status' })
  @Column({ type: 'varchar', length: 20, default: FeedbackRequestStatus.DRAFT })
  status: FeedbackRequestStatus;

  @ApiProperty({ description: 'Required submission mode' })
  @Column({ type: 'varchar', length: 20, default: FeedbackSubmissionMode.IDENTIFIED })
  submissionMode: FeedbackSubmissionMode;

  @ApiProperty({ description: 'Whether completion is mandatory' })
  @Column({ type: 'boolean', default: false })
  isMandatory: boolean;

  @ApiProperty({ description: 'Due date' })
  @Column({ type: 'date', nullable: true })
  dueDate: Date | null;

  @ApiProperty({ description: 'Audience target type' })
  @Column({ type: 'varchar', length: 30 })
  audienceType: AudienceTargetType;

  @ApiProperty({ description: 'Audience target configuration' })
  @Column({ type: 'jsonb', nullable: true })
  audienceConfig: Record<string, any> | null;

  @ApiProperty({ description: 'Reminder settings' })
  @Column({ type: 'jsonb', nullable: true })
  reminderSettings: Record<string, any> | null;

  @ApiProperty({ description: 'Created by user ID' })
  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @OneToMany(() => FeedbackRequestAssignment, (a) => a.feedbackRequest, {
    cascade: true,
  })
  assignments: FeedbackRequestAssignment[];

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
