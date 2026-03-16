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
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { StateMachineDefinitionI18n } from './state-machine-definition-i18n.entity';
import { StateMachineState } from './state-machine-state.entity';
import { StateMachineTransition } from './state-machine-transition.entity';
import {
  StateMachineDefinitionStatus,
  StateMachineCategory,
} from '../enums/state-machine.enums';

@Entity('state_machine_definitions')
@Unique('UQ_sm_definition_company_code', ['companyId', 'code'])
export class StateMachineDefinition {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ description: 'Stable machine-readable code', example: 'leave_request_lifecycle' })
  @Column({ type: 'varchar', length: 255 })
  code: string;

  @ApiProperty({ description: 'Target resource type this machine applies to', example: 'leave_request' })
  @Column({ type: 'varchar', length: 255 })
  resourceType: string;

  @ApiProperty({ description: 'Category hint', enum: StateMachineCategory })
  @Column({ type: 'varchar', length: 50, default: StateMachineCategory.LIFECYCLE })
  category: StateMachineCategory;

  @ApiProperty({ description: 'Publishing status', enum: StateMachineDefinitionStatus })
  @Column({ type: 'varchar', length: 50, default: StateMachineDefinitionStatus.DRAFT })
  status: StateMachineDefinitionStatus;

  @ApiProperty({ description: 'Version number (increment on publish)' })
  @Column({ type: 'int', default: 1 })
  version: number;

  @ApiProperty({ description: 'Code of the initial state' })
  @Column({ type: 'varchar', length: 255 })
  initialStateCode: string;

  @ApiProperty({ description: 'Whether this definition is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Additional config/metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => StateMachineDefinitionI18n, (i) => i.definition, { cascade: true, eager: false })
  translations: StateMachineDefinitionI18n[];

  @OneToMany(() => StateMachineState, (s) => s.definition, { cascade: true })
  states: StateMachineState[];

  @OneToMany(() => StateMachineTransition, (t) => t.definition, { cascade: true })
  transitions: StateMachineTransition[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
