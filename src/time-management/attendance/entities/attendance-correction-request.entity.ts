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
import { Company } from '../../../company/entities/company.entity';
import { Employee } from '../../../employee/entities/employee.entity';
import { AttendanceRecord } from './attendance-record.entity';
import { CorrectionType, CorrectionStatus } from '../enums/attendance.enums';

@Entity('attendance_correction_requests')
@Index('IDX_attendance_correction_company', ['companyId'])
@Index('IDX_attendance_correction_employee', ['companyId', 'employeeId'])
@Index('IDX_attendance_correction_status', ['companyId', 'status'])
export class AttendanceCorrectionRequest {
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

  @ApiProperty({ description: 'Related attendance record ID', required: false })
  @Column({ name: 'attendance_record_id', type: 'uuid', nullable: true })
  attendanceRecordId: string | null;

  @ManyToOne(() => AttendanceRecord, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'attendance_record_id' })
  attendanceRecord: AttendanceRecord | null;

  @ApiProperty({ description: 'Date for correction' })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Correction type', enum: CorrectionType })
  @Column({ name: 'correction_type', type: 'varchar', length: 50 })
  correctionType: CorrectionType;

  @ApiProperty({ description: 'Requested check-in time', required: false })
  @Column({ name: 'requested_check_in', type: 'timestamptz', nullable: true })
  requestedCheckIn: Date | null;

  @ApiProperty({ description: 'Requested check-out time', required: false })
  @Column({ name: 'requested_check_out', type: 'timestamptz', nullable: true })
  requestedCheckOut: Date | null;

  @ApiProperty({ description: 'Reason for correction' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ description: 'Correction status', enum: CorrectionStatus })
  @Column({ type: 'varchar', length: 50, default: CorrectionStatus.PENDING })
  status: CorrectionStatus;

  @ApiProperty({ description: 'Reviewer user ID', required: false })
  @Column({ name: 'reviewer_id', type: 'uuid', nullable: true })
  reviewerId: string | null;

  @ApiProperty({ description: 'Reviewed at', required: false })
  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @ApiProperty({ description: 'Review notes', required: false })
  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string | null;

  @ApiProperty({ description: 'Workflow instance ID', required: false })
  @Column({ name: 'workflow_instance_id', type: 'uuid', nullable: true })
  workflowInstanceId: string | null;

  @ApiProperty({ description: 'State machine instance ID', required: false })
  @Column({ name: 'state_machine_instance_id', type: 'uuid', nullable: true })
  stateMachineInstanceId: string | null;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
