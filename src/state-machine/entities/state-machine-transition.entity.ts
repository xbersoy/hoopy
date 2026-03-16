import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { StateMachineDefinition } from './state-machine-definition.entity';
import { StateMachineState } from './state-machine-state.entity';
import { StateMachineTransitionI18n } from './state-machine-transition-i18n.entity';

@Entity('state_machine_transitions')
@Unique('UQ_sm_transition_definition_code', ['definitionId', 'code'])
export class StateMachineTransition {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'definition_id', type: 'uuid' })
  definitionId: string;

  @ManyToOne(() => StateMachineDefinition, (d) => d.transitions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'definition_id' })
  definition: StateMachineDefinition;

  @ApiProperty({ description: 'Stable transition code', example: 'submit' })
  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ name: 'from_state_id', type: 'uuid' })
  fromStateId: string;

  @ManyToOne(() => StateMachineState, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_state_id' })
  fromState: StateMachineState;

  @Column({ name: 'to_state_id', type: 'uuid' })
  toStateId: string;

  @ManyToOne(() => StateMachineState, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_state_id' })
  toState: StateMachineState;

  @ApiProperty({
    description:
      'Guard condition (JSON DSL). Transition only allowed if this evaluates true.',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  guardCondition: Record<string, any>;

  @ApiProperty({
    description:
      'Priority for ordering when multiple transitions share from-state (lower = first)',
  })
  @Column({ type: 'int', default: 0 })
  priority: number;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => StateMachineTransitionI18n, (i) => i.transition, {
    cascade: true,
    eager: false,
  })
  translations: StateMachineTransitionI18n[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
