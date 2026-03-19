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
import { Employee } from '../../employee/entities/employee.entity';
import { User } from '../../user/entities/user.entity';
import { FeedbackCategory } from './feedback-category.entity';
import { FeedbackMessage } from './feedback-message.entity';
import { FeedbackAttachment } from './feedback-attachment.entity';
import {
  FeedbackSubmissionMode,
  FeedbackStatus,
  FeedbackSensitivity,
} from '../enums';

@Entity('feedback_items')
@Index('IDX_feedback_item_company_status', ['companyId', 'status'])
@Index('IDX_feedback_item_category', ['companyId', 'categoryId'])
@Index('IDX_feedback_item_submitted_by', ['submittedById'])
@Index('IDX_feedback_item_assigned_to', ['assignedToUserId'])
export class FeedbackItem {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ description: 'Category ID' })
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => FeedbackCategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: FeedbackCategory;

  @ApiProperty({ description: 'Submission mode' })
  @Column({ type: 'varchar', length: 20 })
  submissionMode: FeedbackSubmissionMode;

  @ApiProperty({ description: 'Subject/title' })
  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @ApiProperty({ description: 'Feedback body/message' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ description: 'Current status' })
  @Column({ type: 'varchar', length: 30, default: FeedbackStatus.SUBMITTED })
  status: FeedbackStatus;

  @ApiProperty({ description: 'Sensitivity level' })
  @Column({ type: 'varchar', length: 20, default: FeedbackSensitivity.NORMAL })
  sensitivity: FeedbackSensitivity;

  @ApiProperty({
    description: 'Submitted by employee ID (null for anonymous)',
  })
  @Column({ name: 'submitted_by_id', type: 'uuid', nullable: true })
  submittedById: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'submitted_by_id' })
  submittedBy: Employee | null;

  @ApiProperty({ description: 'Assigned HR user ID' })
  @Column({ name: 'assigned_to_user_id', type: 'uuid', nullable: true })
  assignedToUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_to_user_id' })
  assignedToUser: User | null;

  @ApiProperty({ description: 'Resolution notes' })
  @Column({ type: 'text', nullable: true })
  resolutionNotes: string | null;

  @ApiProperty({ description: 'Related feedback request ID' })
  @Column({ name: 'feedback_request_id', type: 'uuid', nullable: true })
  feedbackRequestId: string | null;

  @ApiProperty({ description: 'Additional metadata' })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => FeedbackMessage, (msg) => msg.feedbackItem, { cascade: true })
  messages: FeedbackMessage[];

  @OneToMany(() => FeedbackAttachment, (att) => att.feedbackItem, {
    cascade: true,
  })
  attachments: FeedbackAttachment[];

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
