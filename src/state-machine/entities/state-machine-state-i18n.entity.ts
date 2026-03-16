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
import { StateMachineState } from './state-machine-state.entity';

@Entity('state_machine_state_i18n')
@Unique('UQ_sm_state_i18n_state_locale', ['stateId', 'locale'])
@Index('IDX_sm_state_i18n_company_locale', ['companyId', 'locale'])
export class StateMachineStateI18n {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'state_id', type: 'uuid' })
  stateId: string;

  @ManyToOne(() => StateMachineState, (s) => s.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'state_id' })
  state: StateMachineState;

  @ApiProperty({ description: 'BCP-47 locale', example: 'en' })
  @Column({ type: 'varchar', length: 35 })
  locale: string;

  @ApiProperty({
    description: 'Localized state name',
    example: 'Pending Approval',
  })
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
