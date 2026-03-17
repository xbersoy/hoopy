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
import { ScheduleTemplate } from './schedule-template.entity';
import { ShiftTemplate } from './shift-template.entity';

@Entity('employee_schedules')
@Index('IDX_employee_schedule_company', ['companyId'])
@Index('IDX_employee_schedule_employee', ['companyId', 'employeeId'])
@Index('IDX_employee_schedule_effective', ['companyId', 'employeeId', 'effectiveFrom', 'effectiveUntil'])
export class EmployeeSchedule {
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

  @Column({ name: 'schedule_template_id', type: 'uuid' })
  scheduleTemplateId: string;

  @ManyToOne(() => ScheduleTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schedule_template_id' })
  scheduleTemplate: ScheduleTemplate;

  @Column({ name: 'shift_template_id', type: 'uuid', nullable: true })
  shiftTemplateId: string | null;

  @ManyToOne(() => ShiftTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'shift_template_id' })
  shiftTemplate: ShiftTemplate | null;

  @ApiProperty({ description: 'Effective from date' })
  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: Date;

  @ApiProperty({ description: 'Effective until date', required: false })
  @Column({ name: 'effective_until', type: 'date', nullable: true })
  effectiveUntil: Date | null;

  @ApiProperty({ description: 'Whether the assignment is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Notes', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
