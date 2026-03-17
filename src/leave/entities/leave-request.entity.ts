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
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { LeaveType } from './leave-type.entity';
import { LeavePolicy } from './leave-policy.entity';
import { LeaveRequestSegment } from './leave-request-segment.entity';
import { LeaveRequestStatus, SessionType } from '../enums/leave.enums';

@Entity('leave_requests')
@Index('IDX_leave_request_employee', ['companyId', 'employeeId'])
@Index('IDX_leave_request_status', ['companyId', 'status'])
@Index('IDX_leave_request_dates', ['employeeId', 'startDate', 'endDate'])
export class LeaveRequest {
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

  @ApiProperty({ description: 'User who submitted the request (may differ from employee)' })
  @Column({ name: 'requester_user_id', type: 'uuid' })
  requesterUserId: string;

  @Column({ name: 'leave_type_id', type: 'uuid' })
  @Index()
  leaveTypeId: string;

  @ManyToOne(() => LeaveType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leave_type_id' })
  leaveType: LeaveType;

  @Column({ name: 'matched_policy_id', type: 'uuid', nullable: true })
  matchedPolicyId: string | null;

  @ManyToOne(() => LeavePolicy, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'matched_policy_id' })
  matchedPolicy: LeavePolicy;

  @ApiProperty({ description: 'Business status', enum: LeaveRequestStatus })
  @Column({ type: 'varchar', length: 50, default: LeaveRequestStatus.DRAFT })
  status: LeaveRequestStatus;

  @ApiProperty({ description: 'Start date of leave' })
  @Column({ type: 'date' })
  startDate: Date;

  @ApiProperty({ description: 'End date of leave' })
  @Column({ type: 'date' })
  endDate: Date;

  @ApiProperty({ description: 'Start session type', enum: SessionType })
  @Column({ type: 'varchar', length: 20, default: SessionType.FULL_DAY })
  startSession: SessionType;

  @ApiProperty({ description: 'End session type', enum: SessionType })
  @Column({ type: 'varchar', length: 20, default: SessionType.FULL_DAY })
  endSession: SessionType;

  @ApiProperty({ description: 'Total duration in days' })
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  durationDays: number;

  @ApiProperty({ description: 'Reason for leave', required: false })
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @ApiProperty({ description: 'Snapshot of policy at submission time', required: false })
  @Column({ type: 'jsonb', nullable: true })
  policySnapshot: Record<string, any> | null;

  @ApiProperty({ description: 'Snapshot of org context at submission time', required: false })
  @Column({ type: 'jsonb', nullable: true })
  orgSnapshot: Record<string, any> | null;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'Workflow instance ID', required: false })
  @Column({ name: 'workflow_instance_id', type: 'uuid', nullable: true })
  workflowInstanceId: string | null;

  @ApiProperty({ description: 'State machine instance ID', required: false })
  @Column({ name: 'state_machine_instance_id', type: 'uuid', nullable: true })
  stateMachineInstanceId: string | null;

  @OneToMany(() => LeaveRequestSegment, (seg) => seg.leaveRequest, { cascade: true })
  segments: LeaveRequestSegment[];

  @Column({ type: 'int', default: 1 })
  versionNo: number;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
