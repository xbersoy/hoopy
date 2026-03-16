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
import { WorkflowDefinition } from './workflow-definition.entity';
import { WorkflowStepDefinition } from './workflow-step-definition.entity';
import { WorkflowTransitionDefinition } from './workflow-transition-definition.entity';
import {
  WorkflowDefinitionStatus,
  WorkflowTriggerMode,
} from '../enums/workflow.enums';

@Entity('workflow_definition_versions')
@Index(['definitionId', 'version'], { unique: true })
export class WorkflowDefinitionVersion {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkflowDefinition, (d) => d.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'definition_id' })
  definition: WorkflowDefinition;

  @Column({ name: 'definition_id' })
  definitionId: string;

  @ApiProperty({ description: 'Version number', example: 1 })
  @Column({ type: 'int' })
  version: number;

  @ApiProperty({ description: 'Version status', enum: WorkflowDefinitionStatus })
  @Column({ type: 'varchar', default: WorkflowDefinitionStatus.DRAFT })
  status: WorkflowDefinitionStatus;

  @ApiProperty({ description: 'How this workflow is triggered', enum: WorkflowTriggerMode })
  @Column({ type: 'varchar', default: WorkflowTriggerMode.MANUAL })
  triggerMode: WorkflowTriggerMode;

  @ApiProperty({
    description: 'Entry criteria conditions (JSON DSL). Workflow is selected only if these match.',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  entryCriteria: Record<string, any>;

  @ApiProperty({
    description: 'Notification settings for this workflow version',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  notificationConfig: Record<string, any>;

  @ApiProperty({
    description: 'SLA / due date defaults for the entire workflow',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  slaConfig: Record<string, any>;

  @ApiProperty({
    description: 'Cancellation / rejection behavior config',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  behaviorConfig: Record<string, any>;

  @ApiProperty({ description: 'Optional notes about this version', required: false })
  @Column({ type: 'text', nullable: true })
  changeNotes: string;

  @ApiProperty({ description: 'When this version was published', required: false })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date;

  @OneToMany(() => WorkflowStepDefinition, (s) => s.version, { cascade: true })
  steps: WorkflowStepDefinition[];

  @OneToMany(() => WorkflowTransitionDefinition, (t) => t.version, { cascade: true })
  transitions: WorkflowTransitionDefinition[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
