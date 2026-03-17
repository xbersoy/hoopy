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
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../../company/entities/company.entity';
import { Employee } from '../../../employee/entities/employee.entity';
import { TimesheetStatus } from '../enums/timesheet.enums';
import { TimesheetEntry } from './timesheet-entry.entity';

@Entity('timesheet_periods')
@Unique('UQ_timesheet_period_company_employee_dates', [
  'companyId',
  'employeeId',
  'periodStart',
  'periodEnd',
])
@Index('IDX_timesheet_period_company', ['companyId'])
@Index('IDX_timesheet_period_employee', ['companyId', 'employeeId'])
@Index('IDX_timesheet_period_status', ['companyId', 'status'])
export class TimesheetPeriod {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({ description: 'Period start date' })
  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @ApiProperty({ description: 'Period end date' })
  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  @ApiProperty({ description: 'Timesheet status', enum: TimesheetStatus })
  @Column({ type: 'varchar', length: 50, default: TimesheetStatus.DRAFT })
  status: TimesheetStatus;

  @ApiProperty({ description: 'Total worked minutes' })
  @Column({ name: 'total_worked_minutes', type: 'int', default: 0 })
  totalWorkedMinutes: number;

  @ApiProperty({ description: 'Total overtime minutes' })
  @Column({ name: 'total_overtime_minutes', type: 'int', default: 0 })
  totalOvertimeMinutes: number;

  @ApiProperty({ description: 'Submitted at', required: false })
  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @ApiProperty({ description: 'Approved at', required: false })
  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @ApiProperty({ description: 'Approved by user ID', required: false })
  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @ApiProperty({ description: 'Rejected at', required: false })
  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @ApiProperty({ description: 'Rejection reason', required: false })
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ description: 'Whether the timesheet is locked' })
  @Column({ name: 'is_locked', type: 'boolean', default: false })
  isLocked: boolean;

  @ApiProperty({ description: 'Workflow instance ID', required: false })
  @Column({ name: 'workflow_instance_id', type: 'uuid', nullable: true })
  workflowInstanceId: string | null;

  @ApiProperty({ description: 'State machine instance ID', required: false })
  @Column({ name: 'state_machine_instance_id', type: 'uuid', nullable: true })
  stateMachineInstanceId: string | null;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => TimesheetEntry, (entry) => entry.timesheetPeriod)
  entries: TimesheetEntry[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
