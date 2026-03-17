import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../../company/entities/company.entity';
import { Employee } from '../../../employee/entities/employee.entity';
import { AttendanceStatus, CheckSource } from '../enums/attendance.enums';

@Entity('attendance_records')
@Unique('UQ_attendance_company_employee_date', ['companyId', 'employeeId', 'date'])
@Index('IDX_attendance_record_company', ['companyId'])
@Index('IDX_attendance_record_employee', ['companyId', 'employeeId'])
@Index('IDX_attendance_record_date', ['companyId', 'date'])
export class AttendanceRecord {
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

  @ApiProperty({ description: 'Attendance date' })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Attendance status', enum: AttendanceStatus })
  @Column({ type: 'varchar', length: 50, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @ApiProperty({ description: 'Check-in time', required: false })
  @Column({ name: 'check_in', type: 'timestamptz', nullable: true })
  checkIn: Date | null;

  @ApiProperty({ description: 'Check-out time', required: false })
  @Column({ name: 'check_out', type: 'timestamptz', nullable: true })
  checkOut: Date | null;

  @ApiProperty({ description: 'Check-in source', enum: CheckSource, required: false })
  @Column({ name: 'check_in_source', type: 'varchar', length: 50, nullable: true })
  checkInSource: CheckSource | null;

  @ApiProperty({ description: 'Check-out source', enum: CheckSource, required: false })
  @Column({ name: 'check_out_source', type: 'varchar', length: 50, nullable: true })
  checkOutSource: CheckSource | null;

  @ApiProperty({ description: 'Total worked minutes', required: false })
  @Column({ name: 'worked_minutes', type: 'int', nullable: true })
  workedMinutes: number | null;

  @ApiProperty({ description: 'Break minutes', required: false })
  @Column({ name: 'break_minutes', type: 'int', nullable: true })
  breakMinutes: number | null;

  @ApiProperty({ description: 'Overtime minutes', required: false })
  @Column({ name: 'overtime_minutes', type: 'int', nullable: true })
  overtimeMinutes: number | null;

  @ApiProperty({ description: 'Late arrival minutes', required: false })
  @Column({ name: 'late_minutes', type: 'int', nullable: true })
  lateMinutes: number | null;

  @ApiProperty({ description: 'Early departure minutes', required: false })
  @Column({ name: 'early_departure_minutes', type: 'int', nullable: true })
  earlyDepartureMinutes: number | null;

  @ApiProperty({ description: 'Whether the shift is overnight' })
  @Column({ name: 'is_overnight', type: 'boolean', default: false })
  isOvernight: boolean;

  @ApiProperty({ description: 'Timezone', required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string | null;

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
