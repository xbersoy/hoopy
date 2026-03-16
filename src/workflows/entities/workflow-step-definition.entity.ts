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
import { WorkflowDefinitionVersion } from './workflow-definition-version.entity';
import { WorkflowStepI18n } from './workflow-step-i18n.entity';
import {
  WorkflowStepType,
  ApprovalStrategy,
  AssigneeStrategy,
} from '../enums/workflow.enums';

@Entity('workflow_step_definitions')
@Index(['versionId', 'code'], { unique: true })
export class WorkflowStepDefinition {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkflowDefinitionVersion, (v) => v.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'version_id' })
  version: WorkflowDefinitionVersion;

  @Column({ name: 'version_id' })
  versionId: string;

  @ApiProperty({
    description: 'Unique step code within the version',
    example: 'manager_approval',
  })
  @Column()
  code: string;

  @ApiProperty({
    description:
      'Corresponding state machine transition code that this step handles',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  transitionCode: string;

  @ApiProperty({ description: 'Type of step', enum: WorkflowStepType })
  @Column({ type: 'varchar', default: WorkflowStepType.APPROVAL })
  type: WorkflowStepType;

  @ApiProperty({
    description: 'Order in the sequence (lower = earlier)',
    example: 1,
  })
  @Column({ type: 'int' })
  sortOrder: number;

  @ApiProperty({
    description: 'Assignee resolution strategy',
    enum: AssigneeStrategy,
  })
  @Column({ type: 'varchar' })
  assigneeStrategy: AssigneeStrategy;

  @ApiProperty({
    description: 'Configuration for the assignee strategy',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  assigneeConfig: Record<string, any>;

  @ApiProperty({
    description: 'Approval strategy for multi-assignee steps',
    enum: ApprovalStrategy,
  })
  @Column({ type: 'varchar', default: ApprovalStrategy.ANY })
  approvalStrategy: ApprovalStrategy;

  @ApiProperty({
    description: 'Entry condition (JSON DSL): if not met, step is skipped',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  entryCondition: Record<string, any>;

  @ApiProperty({ description: 'SLA duration in hours', required: false })
  @Column({ type: 'int', nullable: true })
  slaDurationHours: number;

  @ApiProperty({ description: 'Escalation config', required: false })
  @Column({ type: 'jsonb', nullable: true })
  escalationConfig: Record<string, any>;

  @ApiProperty({ description: 'Whether comment is required', default: false })
  @Column({ default: false })
  isCommentRequired: boolean;

  @ApiProperty({
    description: 'Whether attachment is required',
    default: false,
  })
  @Column({ default: false })
  isAttachmentRequired: boolean;

  @ApiProperty({
    description: 'Whether step can be skipped by admin',
    default: false,
  })
  @Column({ default: false })
  isSkippable: boolean;

  @ApiProperty({
    description: 'Whether step auto-completes if conditions met',
    default: false,
  })
  @Column({ default: false })
  isAutoComplete: boolean;

  @ApiProperty({ description: 'Auto-complete condition', required: false })
  @Column({ type: 'jsonb', nullable: true })
  autoCompleteCondition: Record<string, any>;

  @ApiProperty({ description: 'Custom form/task config', required: false })
  @Column({ type: 'jsonb', nullable: true })
  formConfig: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => WorkflowStepI18n, (i) => i.step, {
    cascade: true,
    eager: false,
  })
  translations: WorkflowStepI18n[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
