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
import { WorkflowInstance } from './workflow-instance.entity';
import { WorkflowActionType } from '../enums/workflow.enums';

@Entity('workflow_action_logs')
@Index(['instanceId', 'createdAt'])
export class WorkflowActionLog {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkflowInstance, (i) => i.actionLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_id' })
  instance: WorkflowInstance;

  @Column({ name: 'instance_id' })
  instanceId: string;

  @ApiProperty({ description: 'Step instance this action relates to', required: false })
  @Column({ type: 'uuid', nullable: true })
  stepInstanceId: string;

  @ApiProperty({ description: 'Type of action', enum: WorkflowActionType })
  @Column({ type: 'varchar' })
  action: WorkflowActionType;

  @ApiProperty({ description: 'User ID who performed this action', required: false })
  @Column({ type: 'uuid', nullable: true })
  actorId: string;

  @ApiProperty({ description: 'Status before this action', required: false })
  @Column({ nullable: true })
  fromStatus: string;

  @ApiProperty({ description: 'Status after this action', required: false })
  @Column({ nullable: true })
  toStatus: string;

  @ApiProperty({ description: 'Comment or note for this action', required: false })
  @Column({ type: 'text', nullable: true })
  comment: string;

  @ApiProperty({ description: 'Additional metadata/context for this action', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'IP address of the actor', required: false })
  @Column({ nullable: true })
  ipAddress: string;

  @ApiProperty({ description: 'User agent of the actor', required: false })
  @Column({ nullable: true })
  userAgent: string;

  @ApiProperty({ description: 'When this action occurred' })
  @CreateDateColumn()
  createdAt: Date;
}
