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
import { WorkflowInstance } from './workflow-instance.entity';
import { WorkflowStepAssignee } from './workflow-step-assignee.entity';
import {
  WorkflowStepInstanceStatus,
  WorkflowStepType,
  ApprovalStrategy,
} from '../enums/workflow.enums';

@Entity('workflow_step_instances')
@Index(['instanceId', 'status'])
export class WorkflowStepInstance {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkflowInstance, (i) => i.stepInstances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'instance_id' })
  instance: WorkflowInstance;

  @Column({ name: 'instance_id' })
  instanceId: string;

  @ApiProperty({
    description: 'Reference to the step definition this was created from',
  })
  @Column({ type: 'uuid' })
  stepDefinitionId: string;

  @ApiProperty({
    description: 'Step name (copied from definition for historical stability)',
  })
  @Column()
  name: string;

  @ApiProperty({ description: 'Step code (copied from definition)' })
  @Column()
  code: string;

  @ApiProperty({ description: 'Step type', enum: WorkflowStepType })
  @Column({ type: 'varchar' })
  type: WorkflowStepType;

  @ApiProperty({ description: 'Order in the sequence' })
  @Column({ type: 'int' })
  sortOrder: number;

  @ApiProperty({ description: 'Approval strategy', enum: ApprovalStrategy })
  @Column({ type: 'varchar', default: ApprovalStrategy.ANY })
  approvalStrategy: ApprovalStrategy;

  @ApiProperty({
    description: 'Current step status',
    enum: WorkflowStepInstanceStatus,
  })
  @Column({ type: 'varchar', default: WorkflowStepInstanceStatus.PENDING })
  status: WorkflowStepInstanceStatus;

  @ApiProperty({ description: 'When this step was activated', required: false })
  @Column({ type: 'timestamptz', nullable: true })
  activatedAt: Date;

  @ApiProperty({
    description: 'When this step was completed/resolved',
    required: false,
  })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @ApiProperty({ description: 'Due date for this step', required: false })
  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date;

  @ApiProperty({
    description: 'When a reminder was last sent',
    required: false,
  })
  @Column({ type: 'timestamptz', nullable: true })
  reminderSentAt: Date;

  @ApiProperty({ description: 'When this step was escalated', required: false })
  @Column({ type: 'timestamptz', nullable: true })
  escalatedAt: Date;

  @ApiProperty({ description: 'Whether comment is required', default: false })
  @Column({ default: false })
  isCommentRequired: boolean;

  @ApiProperty({
    description: 'Whether attachment is required',
    default: false,
  })
  @Column({ default: false })
  isAttachmentRequired: boolean;

  @ApiProperty({ description: 'Whether step is skippable', default: false })
  @Column({ default: false })
  isSkippable: boolean;

  @ApiProperty({
    description: 'Decision/result of the step action',
    required: false,
  })
  @Column({ nullable: true })
  decision: string;

  @ApiProperty({
    description: 'Comment left during the action',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  comment: string;

  @ApiProperty({
    description: 'Additional metadata/form data collected at this step',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({
    description:
      'Snapshot of the step definition config (for historical stability)',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  definitionSnapshot: Record<string, any>;

  @OneToMany(() => WorkflowStepAssignee, (a) => a.stepInstance, {
    cascade: true,
  })
  assignees: WorkflowStepAssignee[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
