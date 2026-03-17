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
import { TimesheetPeriod } from './timesheet-period.entity';

@Entity('timesheet_entries')
@Index('IDX_timesheet_entry_period', ['timesheetPeriodId'])
@Index('IDX_timesheet_entry_date', ['timesheetPeriodId', 'date'])
export class TimesheetEntry {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'timesheet_period_id', type: 'uuid' })
  timesheetPeriodId: string;

  @ManyToOne(() => TimesheetPeriod, (period) => period.entries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'timesheet_period_id' })
  timesheetPeriod: TimesheetPeriod;

  @ApiProperty({ description: 'Entry date' })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Start time', required: false })
  @Column({ name: 'start_time', type: 'timestamptz', nullable: true })
  startTime: Date | null;

  @ApiProperty({ description: 'End time', required: false })
  @Column({ name: 'end_time', type: 'timestamptz', nullable: true })
  endTime: Date | null;

  @ApiProperty({ description: 'Worked minutes' })
  @Column({ name: 'worked_minutes', type: 'int', default: 0 })
  workedMinutes: number;

  @ApiProperty({ description: 'Break minutes' })
  @Column({ name: 'break_minutes', type: 'int', default: 0 })
  breakMinutes: number;

  @ApiProperty({ description: 'Overtime minutes' })
  @Column({ name: 'overtime_minutes', type: 'int', default: 0 })
  overtimeMinutes: number;

  @ApiProperty({ description: 'Description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Project code', required: false })
  @Column({
    name: 'project_code',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  projectCode: string | null;

  @ApiProperty({ description: 'Task code', required: false })
  @Column({ name: 'task_code', type: 'varchar', length: 100, nullable: true })
  taskCode: string | null;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
