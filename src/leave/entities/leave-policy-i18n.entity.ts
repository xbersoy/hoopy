import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { LeavePolicy } from './leave-policy.entity';

@Entity('leave_policy_i18n')
@Unique('UQ_leave_policy_i18n_locale', ['leavePolicyId', 'locale'])
@Index('IDX_leave_policy_i18n_company_locale', ['companyId', 'locale'])
export class LeavePolicyI18n {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'leave_policy_id', type: 'uuid' })
  leavePolicyId: string;

  @ManyToOne(() => LeavePolicy, (lp) => lp.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leave_policy_id' })
  leavePolicy: LeavePolicy;

  @ApiProperty({ description: 'BCP-47 locale code', example: 'en' })
  @Column({ type: 'varchar', length: 35 })
  locale: string;

  @ApiProperty({ description: 'Localized name', example: 'Standard Annual Leave Policy' })
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
