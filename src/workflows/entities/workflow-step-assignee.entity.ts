import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowStepInstance } from './workflow-step-instance.entity';

@Entity('workflow_step_assignees')
export class WorkflowStepAssignee {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkflowStepInstance, (s) => s.assignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_instance_id' })
  stepInstance: WorkflowStepInstance;

  @Column({ name: 'step_instance_id' })
  stepInstanceId: string;

  @ApiProperty({ description: 'Assigned user ID' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Original assignee if this is a delegation', required: false })
  @Column({ type: 'uuid', nullable: true })
  originalUserId: string;

  @ApiProperty({ description: 'User who delegated this assignment', required: false })
  @Column({ type: 'uuid', nullable: true })
  delegatedById: string;

  @ApiProperty({ description: 'Type of delegation', required: false, example: 'vacation' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  delegationType: string;

  @ApiProperty({ description: 'How this assignee was resolved', example: 'manager' })
  @Column()
  resolvedVia: string;

  @ApiProperty({ description: 'Whether this assignee has acted', default: false })
  @Column({ default: false })
  hasActed: boolean;

  @ApiProperty({ description: 'The decision made by this assignee', required: false })
  @Column({ nullable: true })
  decision: string;

  @ApiProperty({ description: 'Comment from this assignee', required: false })
  @Column({ type: 'text', nullable: true })
  comment: string;

  @ApiProperty({ description: 'When this assignee acted', required: false })
  @Column({ type: 'timestamptz', nullable: true })
  actedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
