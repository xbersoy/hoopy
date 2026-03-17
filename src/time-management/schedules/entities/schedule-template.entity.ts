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
import { ScheduleTemplateI18n } from './schedule-template-i18n.entity';
import { ScheduleType } from '../enums/schedule.enums';

@Entity('schedule_templates')
@Unique('UQ_schedule_template_company_code', ['companyId', 'code'])
@Index('IDX_schedule_template_company', ['companyId'])
export class ScheduleTemplate {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ description: 'Unique code within company' })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @ApiProperty({ description: 'Schedule template name' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Schedule type', enum: ScheduleType })
  @Column({ name: 'schedule_type', type: 'varchar', length: 50, default: ScheduleType.FIXED })
  scheduleType: ScheduleType;

  @ApiProperty({ description: 'Work days configuration' })
  @Column({ name: 'work_days', type: 'jsonb', default: [] })
  workDays: string[];

  @ApiProperty({ description: 'Default start time', required: false })
  @Column({ name: 'default_start_time', type: 'time', nullable: true })
  defaultStartTime: string | null;

  @ApiProperty({ description: 'Default end time', required: false })
  @Column({ name: 'default_end_time', type: 'time', nullable: true })
  defaultEndTime: string | null;

  @ApiProperty({ description: 'Break duration in minutes' })
  @Column({ name: 'break_duration_minutes', type: 'int', default: 60 })
  breakDurationMinutes: number;

  @ApiProperty({ description: 'Whether the schedule is overnight' })
  @Column({ name: 'is_overnight', type: 'boolean', default: false })
  isOvernight: boolean;

  @ApiProperty({ description: 'Weekly hours', required: false })
  @Column({ name: 'weekly_hours', type: 'numeric', nullable: true })
  weeklyHours: number | null;

  @ApiProperty({ description: 'Whether the template is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => ScheduleTemplateI18n, (t) => t.scheduleTemplate)
  translations: ScheduleTemplateI18n[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
