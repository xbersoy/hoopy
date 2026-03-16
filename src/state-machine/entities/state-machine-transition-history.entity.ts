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
import { StateMachineInstance } from './state-machine-instance.entity';
import { StateMachineTransition } from './state-machine-transition.entity';
import { StateMachineState } from './state-machine-state.entity';

@Entity('state_machine_transition_history')
@Index('IDX_sm_history_instance_created', ['instanceId', 'createdAt'])
export class StateMachineTransitionHistory {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'instance_id', type: 'uuid' })
  instanceId: string;

  @ManyToOne(() => StateMachineInstance, (i) => i.transitionHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'instance_id' })
  instance: StateMachineInstance;

  @Column({ name: 'transition_id', type: 'uuid' })
  transitionId: string;

  @ManyToOne(() => StateMachineTransition, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'transition_id' })
  transition: StateMachineTransition;

  @Column({ name: 'from_state_id', type: 'uuid' })
  fromStateId: string;

  @ManyToOne(() => StateMachineState, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'from_state_id' })
  fromState: StateMachineState;

  @Column({ name: 'to_state_id', type: 'uuid' })
  toStateId: string;

  @ManyToOne(() => StateMachineState, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'to_state_id' })
  toState: StateMachineState;

  @ApiProperty({
    description: 'User who triggered the transition',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  actorId: string;

  @ApiProperty({ description: 'Comment for this transition', required: false })
  @Column({ type: 'text', nullable: true })
  comment: string;

  @ApiProperty({
    description: 'Context snapshot at the moment of transition',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  contextSnapshot: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'When this transition occurred' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
