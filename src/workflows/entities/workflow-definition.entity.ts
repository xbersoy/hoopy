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
import { Company } from '../../company/entities/company.entity';
import { StateMachineDefinition } from '../../state-machine/entities/state-machine-definition.entity';
import { WorkflowDefinitionVersion } from './workflow-definition-version.entity';
import { WorkflowDefinitionI18n } from './workflow-definition-i18n.entity';

@Entity('workflow_definitions')
@Unique('UQ_workflow_definitions_company_code', ['companyId', 'code'])
export class WorkflowDefinition {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'Unique code within the company',
    example: 'leave_request_approval',
  })
  @Column({ type: 'varchar', length: 255 })
  code: string;

  @ApiProperty({
    description: 'Target resource type',
    example: 'leave_request',
  })
  @Column({ type: 'varchar', length: 255 })
  resourceType: string;

  @ApiProperty({ description: 'Workflow category', required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @ApiProperty({ description: 'Whether this definition is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description:
      'Priority when multiple workflows match (lower = higher priority)',
  })
  @Column({ type: 'int', default: 0 })
  priority: number;

  // ─── State machine binding ───
  @Column({ name: 'state_machine_definition_id', type: 'uuid' })
  stateMachineDefinitionId: string;

  @ManyToOne(() => StateMachineDefinition, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'state_machine_definition_id' })
  stateMachineDefinition: StateMachineDefinition;

  @OneToMany(() => WorkflowDefinitionI18n, (i) => i.definition, {
    cascade: true,
    eager: false,
  })
  translations: WorkflowDefinitionI18n[];

  @OneToMany(() => WorkflowDefinitionVersion, (v) => v.definition, {
    cascade: true,
  })
  versions: WorkflowDefinitionVersion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
