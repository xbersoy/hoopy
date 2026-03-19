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
import { Employee } from '../../employee/entities/employee.entity';
import { FeedbackRequest } from './feedback-request.entity';
import { FeedbackItem } from './feedback-item.entity';
import { FeedbackAssignmentStatus } from '../enums';

@Entity('feedback_request_assignments')
@Index('IDX_feedback_assignment_request', ['feedbackRequestId'])
@Index('IDX_feedback_assignment_employee', ['employeeId'])
@Index('IDX_feedback_assignment_status', ['feedbackRequestId', 'status'])
@Unique('UQ_feedback_assignment_request_employee', ['feedbackRequestId', 'employeeId'])
export class FeedbackRequestAssignment {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'feedback_request_id', type: 'uuid' })
  feedbackRequestId: string;

  @ManyToOne(() => FeedbackRequest, (r) => r.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feedback_request_id' })
  feedbackRequest: FeedbackRequest;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({ description: 'Assignment status' })
  @Column({ type: 'varchar', length: 20, default: FeedbackAssignmentStatus.PENDING })
  status: FeedbackAssignmentStatus;

  @ApiProperty({ description: 'Submitted feedback item ID' })
  @Column({ name: 'feedback_item_id', type: 'uuid', nullable: true })
  feedbackItemId: string | null;

  @ManyToOne(() => FeedbackItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'feedback_item_id' })
  feedbackItem: FeedbackItem | null;

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
