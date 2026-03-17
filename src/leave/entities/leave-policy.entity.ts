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
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { LeaveType } from './leave-type.entity';
import { LeaveEntitlementRule } from './leave-entitlement-rule.entity';
import { LeavePolicyI18n } from './leave-policy-i18n.entity';

@Entity('leave_policies')
@Unique('UQ_leave_policy_company_code', ['companyId', 'code'])
export class LeavePolicy {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'leave_type_id', type: 'uuid' })
  @Index()
  leaveTypeId: string;

  @ManyToOne(() => LeaveType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leave_type_id' })
  leaveType: LeaveType;

  @ApiProperty({ description: 'Unique code', example: 'standard_annual' })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @ApiProperty({ description: 'Policy name', example: 'Standard Annual Leave Policy' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Priority for rule matching (lower = higher priority)' })
  @Column({ type: 'int', default: 0 })
  priority: number;

  @ApiProperty({ description: 'Whether this policy is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Effective start date', required: false })
  @Column({ type: 'date', nullable: true })
  effectiveStartDate: Date | null;

  @ApiProperty({ description: 'Effective end date', required: false })
  @Column({ type: 'date', nullable: true })
  effectiveEndDate: Date | null;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => LeaveEntitlementRule, (rule) => rule.policy, { cascade: true })
  entitlementRules: LeaveEntitlementRule[];

  @OneToMany(() => LeavePolicyI18n, (i18n) => i18n.leavePolicy, { cascade: true })
  translations: LeavePolicyI18n[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
