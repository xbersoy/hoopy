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
import { Announcement } from './announcement.entity';
import { Employee } from '../../employee/entities/employee.entity';

@Entity('announcement_recipients')
@Index('IDX_announcement_recipient_announcement', ['announcementId'])
@Index('IDX_announcement_recipient_employee', ['employeeId'])
@Unique('UQ_announcement_recipient', ['announcementId', 'employeeId'])
export class AnnouncementRecipient {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'announcement_id', type: 'uuid' })
  announcementId: string;

  @ManyToOne(() => Announcement, (a) => a.recipients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'announcement_id' })
  announcement: Announcement;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({ description: 'Whether the recipient has read the announcement' })
  @Column({ type: 'boolean', default: false })
  hasRead: boolean;

  @ApiProperty({ description: 'Read timestamp' })
  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @ApiProperty({ description: 'Whether the recipient has acknowledged' })
  @Column({ type: 'boolean', default: false })
  hasAcknowledged: boolean;

  @ApiProperty({ description: 'Acknowledgment timestamp' })
  @Column({ type: 'timestamptz', nullable: true })
  acknowledgedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastReminderAt: Date | null;

  @Column({ type: 'int', default: 0 })
  reminderCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
