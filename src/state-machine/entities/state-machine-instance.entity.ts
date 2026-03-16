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
import { StateMachineDefinition } from './state-machine-definition.entity';
import { StateMachineState } from './state-machine-state.entity';
import { StateMachineTransitionHistory } from './state-machine-transition-history.entity';

@Entity('state_machine_instances')
@Index('IDX_sm_instance_company_resource', [
  'companyId',
  'resourceType',
  'resourceId',
])
@Index('IDX_sm_instance_current_state', ['companyId', 'currentStateId'])
export class StateMachineInstance {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'definition_id', type: 'uuid' })
  definitionId: string;

  @ManyToOne(() => StateMachineDefinition, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'definition_id' })
  definition: StateMachineDefinition;

  // ─── Generic resource binding ───
  @ApiProperty({ description: 'Resource type', example: 'leave_request' })
  @Column({ type: 'varchar', length: 255 })
  resourceType: string;

  @ApiProperty({ description: 'Resource ID' })
  @Column({ type: 'uuid' })
  resourceId: string;

  // ─── Current state ───
  @Column({ name: 'current_state_id', type: 'uuid' })
  currentStateId: string;

  @ManyToOne(() => StateMachineState, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'current_state_id' })
  currentState: StateMachineState;

  @ApiProperty({
    description: 'Whether the instance has reached a final state',
  })
  @Column({ default: false })
  isCompleted: boolean;

  @ApiProperty({
    description: 'Snapshot of definition version at instantiation time',
  })
  @Column({ type: 'int' })
  definitionVersion: number;

  @ApiProperty({
    description: 'Context data available for guard evaluation',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => StateMachineTransitionHistory, (h) => h.instance, {
    cascade: true,
  })
  transitionHistory: StateMachineTransitionHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
