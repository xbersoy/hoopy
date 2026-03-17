import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { LeaveUnitType } from '../enums/leave.enums';
import { LeaveTypeI18n } from './leave-type-i18n.entity';

@Entity('leave_types')
@Unique('UQ_leave_type_company_code', ['companyId', 'code'])
export class LeaveType {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Company ID (null for system/global types)',
    required: false,
  })
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  @Index()
  companyId: string | null;

  @ManyToOne(() => Company, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'System key for built-in types',
    required: false,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  systemKey: string | null;

  @ApiProperty({ description: 'Unique code within company', example: 'annual' })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @ApiProperty({ description: 'Default display name', example: 'Annual Leave' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Unit type', enum: LeaveUnitType })
  @Column({ type: 'varchar', length: 20, default: LeaveUnitType.DAY })
  unitType: LeaveUnitType;

  @ApiProperty({ description: 'Whether this leave is paid' })
  @Column({ default: true })
  isPaid: boolean;

  @ApiProperty({ description: 'Whether balance is required to request' })
  @Column({ default: true })
  requiresBalance: boolean;

  @ApiProperty({ description: 'Whether attachment is required' })
  @Column({ default: false })
  requiresAttachment: boolean;

  @ApiProperty({
    description: 'Min attachment threshold in days (e.g. require after 2 days)',
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  attachmentThresholdDays: number | null;

  @ApiProperty({ description: 'Whether this is a system-provided type' })
  @Column({ default: false })
  isSystem: boolean;

  @ApiProperty({ description: 'Whether this type is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Sort order for display' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Color for UI display', required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string | null;

  @ApiProperty({ description: 'Icon identifier', required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => LeaveTypeI18n, (i18n) => i18n.leaveType, { cascade: true })
  translations: LeaveTypeI18n[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
