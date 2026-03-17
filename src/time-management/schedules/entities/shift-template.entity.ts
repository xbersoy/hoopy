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
import { ShiftTemplateI18n } from './shift-template-i18n.entity';

@Entity('shift_templates')
@Unique('UQ_shift_template_company_code', ['companyId', 'code'])
@Index('IDX_shift_template_company', ['companyId'])
export class ShiftTemplate {
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

  @ApiProperty({ description: 'Shift template name' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Shift start time' })
  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @ApiProperty({ description: 'Shift end time' })
  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @ApiProperty({ description: 'Break duration in minutes' })
  @Column({ name: 'break_duration_minutes', type: 'int', default: 60 })
  breakDurationMinutes: number;

  @ApiProperty({ description: 'Whether the shift is overnight' })
  @Column({ name: 'is_overnight', type: 'boolean', default: false })
  isOvernight: boolean;

  @ApiProperty({ description: 'Display color', required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string | null;

  @ApiProperty({ description: 'Whether the template is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => ShiftTemplateI18n, (t) => t.shiftTemplate)
  translations: ShiftTemplateI18n[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
