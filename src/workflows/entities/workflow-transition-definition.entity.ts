import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowDefinitionVersion } from './workflow-definition-version.entity';
import { WorkflowStepDefinition } from './workflow-step-definition.entity';
import { TransitionAction } from '../enums/workflow.enums';

@Entity('workflow_transition_definitions')
@Index(['versionId', 'fromStepId', 'action', 'priority'], { unique: true })
export class WorkflowTransitionDefinition {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkflowDefinitionVersion, (v) => v.transitions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'version_id' })
  version: WorkflowDefinitionVersion;

  @Column({ name: 'version_id' })
  versionId: string;

  @ManyToOne(() => WorkflowStepDefinition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_step_id' })
  fromStep: WorkflowStepDefinition;

  @Column({ name: 'from_step_id' })
  fromStepId: string;

  @ManyToOne(() => WorkflowStepDefinition, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'to_step_id' })
  toStep: WorkflowStepDefinition;

  @Column({ name: 'to_step_id', nullable: true })
  toStepId: string;

  @ApiProperty({
    description: 'Triggering action for this transition',
    enum: TransitionAction,
  })
  @Column({ type: 'varchar' })
  action: TransitionAction;

  @ApiProperty({
    description:
      'Condition DSL: transition is taken only if condition evaluates true',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  condition: Record<string, any>;

  @ApiProperty({
    description: 'Priority/order for evaluating transitions (lower = first)',
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  priority: number;

  @ApiProperty({
    description: 'Whether this is the default/fallback transition',
    default: false,
  })
  @Column({ default: false })
  isDefault: boolean;

  @ApiProperty({
    description:
      'Optional label for this transition (e.g., "Approve & Forward", "Reject")',
    required: false,
  })
  @Column({ nullable: true })
  label: string;

  @CreateDateColumn()
  createdAt: Date;
}
