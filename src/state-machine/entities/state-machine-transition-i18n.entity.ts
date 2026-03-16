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
import { StateMachineTransition } from './state-machine-transition.entity';

@Entity('state_machine_transition_i18n')
@Unique('UQ_sm_transition_i18n_trans_locale', ['transitionId', 'locale'])
@Index('IDX_sm_transition_i18n_company_locale', ['companyId', 'locale'])
export class StateMachineTransitionI18n {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'transition_id', type: 'uuid' })
  transitionId: string;

  @ManyToOne(() => StateMachineTransition, (t) => t.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transition_id' })
  transition: StateMachineTransition;

  @ApiProperty({ description: 'BCP-47 locale', example: 'en' })
  @Column({ type: 'varchar', length: 35 })
  locale: string;

  @ApiProperty({ description: 'Localized action label', example: 'Submit for Approval' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Localized description/help text', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
