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
import { OvertimeStatus, CompensationType } from '../enums/overtime.enums';

@Entity('overtime_requests')
@Index('IDX_overtime_request_company', ['companyId'])
@Index('IDX_overtime_request_employee', ['companyId', 'employeeId'])
@Index('IDX_overtime_request_status', ['companyId', 'status'])
export class OvertimeRequest {
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

  @ApiProperty({ description: 'Overtime date' })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Planned overtime minutes' })
  @Column({ name: 'planned_minutes', type: 'int' })
  plannedMinutes: number;

  @ApiProperty({ description: 'Actual overtime minutes', required: false })
  @Column({ name: 'actual_minutes', type: 'int', nullable: true })
  actualMinutes: number | null;

  @ApiProperty({ description: 'Reason for overtime' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ description: 'Overtime status', enum: OvertimeStatus })
  @Column({ type: 'varchar', length: 50, default: OvertimeStatus.PENDING })
  status: OvertimeStatus;

  @ApiProperty({ description: 'Compensation type', enum: CompensationType })
  @Column({
    name: 'compensation_type',
    type: 'varchar',
    length: 50,
    default: CompensationType.PAID,
  })
  compensationType: CompensationType;

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
