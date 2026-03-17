import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { LeaveType } from './leave-type.entity';
import { LeaveGrant } from './leave-grant.entity';
import { BalanceTransactionType, BalanceActorType } from '../enums/leave.enums';

@Entity('leave_balance_ledger')
@Index('IDX_balance_ledger_employee_type', ['companyId', 'employeeId', 'leaveTypeId'])
@Index('IDX_balance_ledger_grant', ['leaveGrantId'])
@Index('IDX_balance_ledger_request', ['leaveRequestId'])
export class LeaveBalanceLedger {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
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
  leaveTypeId: string;

  @ManyToOne(() => LeaveType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leave_type_id' })
  leaveType: LeaveType;

  @Column({ name: 'leave_grant_id', type: 'uuid', nullable: true })
  leaveGrantId: string | null;

  @ManyToOne(() => LeaveGrant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'leave_grant_id' })
  leaveGrant: LeaveGrant;

  @ApiProperty({ description: 'Related leave request ID', required: false })
  @Column({ name: 'leave_request_id', type: 'uuid', nullable: true })
  leaveRequestId: string | null;

  @ApiProperty({ description: 'Transaction type', enum: BalanceTransactionType })
  @Column({ type: 'varchar', length: 50 })
  transactionType: BalanceTransactionType;

  @ApiProperty({ description: 'Transaction amount (positive = credit, negative = debit)', example: -3 })
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'When the transaction occurred' })
  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  @ApiProperty({ description: 'Effective date for the transaction' })
  @Column({ type: 'date' })
  effectiveDate: Date;

  @ApiProperty({ description: 'Notes', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Actor type', enum: BalanceActorType })
  @Column({ type: 'varchar', length: 20 })
  actorType: BalanceActorType;

  @ApiProperty({ description: 'Actor user ID', required: false })
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
