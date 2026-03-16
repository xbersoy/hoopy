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
import { WorkflowStepDefinition } from './workflow-step-definition.entity';

@Entity('workflow_step_i18n')
@Unique('UQ_wf_step_i18n_step_locale', ['stepId', 'locale'])
@Index('IDX_wf_step_i18n_company_locale', ['companyId', 'locale'])
export class WorkflowStepI18n {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'step_id', type: 'uuid' })
  stepId: string;

  @ManyToOne(() => WorkflowStepDefinition, (s) => s.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_id' })
  step: WorkflowStepDefinition;

  @ApiProperty({ description: 'BCP-47 locale', example: 'en' })
  @Column({ type: 'varchar', length: 35 })
  locale: string;

  @ApiProperty({ description: 'Localized step name', example: 'Manager Approval' })
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
