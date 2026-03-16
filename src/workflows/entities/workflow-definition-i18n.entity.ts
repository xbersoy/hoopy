import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { WorkflowDefinition } from './workflow-definition.entity';

@Entity('workflow_definition_i18n')
@Unique('UQ_wf_definition_i18n_def_locale', ['definitionId', 'locale'])
@Index('IDX_wf_definition_i18n_company_locale', ['companyId', 'locale'])
export class WorkflowDefinitionI18n {
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

  @ManyToOne(() => WorkflowDefinition, (d) => d.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'definition_id' })
  definition: WorkflowDefinition;

  @ApiProperty({ description: 'BCP-47 locale', example: 'en' })
  @Column({ type: 'varchar', length: 35 })
  locale: string;

  @ApiProperty({ description: 'Localized name', example: 'Leave Request Approval' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Localized description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
