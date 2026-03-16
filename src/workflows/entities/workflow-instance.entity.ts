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
import { StateMachineInstance } from '../../state-machine/entities/state-machine-instance.entity';
import { WorkflowDefinitionVersion } from './workflow-definition-version.entity';
import { WorkflowStepInstance } from './workflow-step-instance.entity';
import { WorkflowActionLog } from './workflow-action-log.entity';
import { WorkflowInstanceStatus } from '../enums/workflow.enums';

@Entity('workflow_instances')
@Index(['companyId', 'resourceType', 'resourceId'])
@Index(['companyId', 'status'])
export class WorkflowInstance {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => WorkflowDefinitionVersion, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'version_id' })
  version: WorkflowDefinitionVersion;

  @Column({ name: 'version_id' })
  versionId: string;

  // ─── State machine instance binding ───
  @Column({ name: 'state_machine_instance_id', type: 'uuid' })
  stateMachineInstanceId: string;

  @ManyToOne(() => StateMachineInstance, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'state_machine_instance_id' })
  stateMachineInstance: StateMachineInstance;

  // ─── Generic resource binding ───
  @ApiProperty({
    description: 'Type of the resource',
    example: 'leave_request',
  })
  @Column()
  resourceType: string;

  @ApiProperty({ description: 'ID of the resource' })
  @Column({ type: 'uuid' })
  resourceId: string;

  // ─── Participants ───
  @ApiProperty({ description: 'User ID who initiated this workflow' })
  @Column({ type: 'uuid' })
  initiatorId: string;

  @ApiProperty({
    description: 'Employee/user ID who is the subject of this workflow',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  subjectId: string;

  // ─── Status ───
  @ApiProperty({
    description: 'Current workflow status',
    enum: WorkflowInstanceStatus,
  })
  @Column({ type: 'varchar', default: WorkflowInstanceStatus.PENDING })
  status: WorkflowInstanceStatus;

  @ApiProperty({
    description: 'ID of the currently active step instance',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  currentStepId: string;

  // ─── Snapshot ───
  @ApiProperty({
    description: 'Snapshot of context data at workflow start',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  contextSnapshot: Record<string, any>;

  @ApiProperty({
    description: 'Snapshot of the definition at start time',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  definitionSnapshot: Record<string, any>;

  // ─── SLA ───
  @ApiProperty({ description: 'Overall workflow due date', required: false })
  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date;

  @ApiProperty({ description: 'When the SLA was breached', required: false })
  @Column({ type: 'timestamptz', nullable: true })
  slaBreachedAt: Date;

  @ApiProperty({
    description: 'When the workflow was completed/terminated',
    required: false,
  })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => WorkflowStepInstance, (s) => s.instance, { cascade: true })
  stepInstances: WorkflowStepInstance[];

  @OneToMany(() => WorkflowActionLog, (l) => l.instance, { cascade: true })
  actionLogs: WorkflowActionLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
