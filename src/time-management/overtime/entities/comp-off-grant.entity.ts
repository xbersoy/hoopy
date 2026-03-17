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
import { OvertimeRequest } from './overtime-request.entity';
import { CompOffStatus } from '../enums/overtime.enums';

@Entity('comp_off_grants')
@Index('IDX_comp_off_grant_company', ['companyId'])
@Index('IDX_comp_off_grant_employee', ['companyId', 'employeeId'])
@Index('IDX_comp_off_grant_status', ['companyId', 'status'])
export class CompOffGrant {
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

  @ApiProperty({ description: 'Related overtime request ID', required: false })
  @Column({ name: 'overtime_request_id', type: 'uuid', nullable: true })
  overtimeRequestId: string | null;

  @ManyToOne(() => OvertimeRequest, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'overtime_request_id' })
  overtimeRequest: OvertimeRequest | null;

  @ApiProperty({ description: 'Granted days' })
  @Column({ name: 'granted_days', type: 'numeric' })
  grantedDays: number;

  @ApiProperty({ description: 'Consumed days' })
  @Column({ name: 'consumed_days', type: 'numeric', default: 0 })
  consumedDays: number;

  @ApiProperty({ description: 'Remaining days' })
  @Column({ name: 'remaining_days', type: 'numeric' })
  remainingDays: number;

  @ApiProperty({ description: 'Valid from date' })
  @Column({ name: 'valid_from', type: 'date' })
  validFrom: Date;

  @ApiProperty({ description: 'Valid until date', required: false })
  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: Date | null;

  @ApiProperty({ description: 'Comp-off status', enum: CompOffStatus })
  @Column({ type: 'varchar', length: 50, default: CompOffStatus.ACTIVE })
  status: CompOffStatus;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
