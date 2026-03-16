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
import { StateMachineStateI18n } from './state-machine-state-i18n.entity';

@Entity('state_machine_states')
@Unique('UQ_sm_state_definition_code', ['definitionId', 'code'])
export class StateMachineState {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'definition_id', type: 'uuid' })
  definitionId: string;

  @ManyToOne(() => StateMachineDefinition, (d) => d.states, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'definition_id' })
  definition: StateMachineDefinition;

  @ApiProperty({ description: 'Stable state code', example: 'pending_approval' })
  @Column({ type: 'varchar', length: 255 })
  code: string;

  @ApiProperty({ description: 'Whether this is a terminal/final state', default: false })
  @Column({ default: false })
  isFinal: boolean;

  @ApiProperty({ description: 'Whether this is the initial state', default: false })
  @Column({ default: false })
  isInitial: boolean;

  @ApiProperty({ description: 'Sort order for UI display' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Color hint for UI', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @ApiProperty({ description: 'Icon hint for UI', required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => StateMachineStateI18n, (i) => i.state, { cascade: true, eager: false })
  translations: StateMachineStateI18n[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
