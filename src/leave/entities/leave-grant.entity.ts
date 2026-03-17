import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { LeaveType } from './leave-type.entity';
import { LeavePolicy } from './leave-policy.entity';
import { LeaveEntitlementRule } from './leave-entitlement-rule.entity';
import { LeaveGrantStatus, GrantSourceType } from '../enums/leave.enums';

@Entity('leave_grants')
@Index('IDX_leave_grant_employee_type', ['companyId', 'employeeId', 'leaveTypeId'])
@Index('IDX_leave_grant_valid_window', ['employeeId', 'leaveTypeId', 'validFrom', 'validUntil'])
export class LeaveGrant {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'employee_id', type: 'uuid' })
  @Index()
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'leave_type_id', type: 'uuid' })
  @Index()
  leaveTypeId: string;

  @ManyToOne(() => LeaveType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leave_type_id' })
  leaveType: LeaveType;

  @Column({ name: 'leave_policy_id', type: 'uuid', nullable: true })
  leavePolicyId: string | null;

  @ManyToOne(() => LeavePolicy, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'leave_policy_id' })
  leavePolicy: LeavePolicy;

  @Column({ name: 'entitlement_rule_id', type: 'uuid', nullable: true })
  entitlementRuleId: string | null;

  @ManyToOne(() => LeaveEntitlementRule, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'entitlement_rule_id' })
  entitlementRule: LeaveEntitlementRule;

  @ApiProperty({ description: 'Reason for the grant' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  grantReason: string | null;

  @ApiProperty({ description: 'Amount originally granted', example: 14 })
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  grantedAmount: number;

  @ApiProperty({ description: 'Amount consumed so far' })
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  consumedAmount: number;

  @ApiProperty({ description: 'Amount reserved by pending requests' })
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  reservedAmount: number;

  @ApiProperty({ description: 'Remaining available balance' })
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  remainingAmount: number;

  @ApiProperty({ description: 'Start of validity window' })
  @Column({ type: 'date' })
  validFrom: Date;

  @ApiProperty({ description: 'End of validity window (null = no expiry)', required: false })
  @Column({ type: 'date', nullable: true })
  validUntil: Date | null;

  @ApiProperty({ description: 'When the grant was created' })
  @Column({ type: 'timestamptz' })
  grantedAt: Date;

  @ApiProperty({ description: 'Source type of the grant', enum: GrantSourceType })
  @Column({ type: 'varchar', length: 50 })
  sourceType: GrantSourceType;

  @ApiProperty({ description: 'Grant status', enum: LeaveGrantStatus })
  @Column({ type: 'varchar', length: 50, default: LeaveGrantStatus.ACTIVE })
  status: LeaveGrantStatus;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
