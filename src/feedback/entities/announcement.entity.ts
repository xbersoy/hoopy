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
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { User } from '../../user/entities/user.entity';
import { AnnouncementRecipient } from './announcement-recipient.entity';
import {
  AnnouncementStatus,
  AnnouncementPriority,
  AudienceTargetType,
} from '../enums';

@Entity('announcements')
@Index('IDX_announcement_company_status', ['companyId', 'status'])
@Index('IDX_announcement_published_at', ['companyId', 'publishedAt'])
export class Announcement {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ description: 'Announcement title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Short summary/subtitle' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  summary: string | null;

  @ApiProperty({ description: 'Announcement body (rich text)' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ description: 'Status' })
  @Column({ type: 'varchar', length: 20, default: AnnouncementStatus.DRAFT })
  status: AnnouncementStatus;

  @ApiProperty({ description: 'Priority level' })
  @Column({ type: 'varchar', length: 20, default: AnnouncementPriority.NORMAL })
  priority: AnnouncementPriority;

  @ApiProperty({ description: 'Whether this announcement is pinned' })
  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @ApiProperty({ description: 'Whether acknowledgment is required' })
  @Column({ type: 'boolean', default: false })
  requiresAcknowledgment: boolean;

  @ApiProperty({ description: 'Acknowledgment due date' })
  @Column({ type: 'date', nullable: true })
  acknowledgmentDueDate: Date | null;

  @ApiProperty({ description: 'Scheduled publish date' })
  @Column({ type: 'timestamptz', nullable: true })
  scheduledPublishAt: Date | null;

  @ApiProperty({ description: 'Actual published date' })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ description: 'Expiration date' })
  @Column({ type: 'date', nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ description: 'Audience target type' })
  @Column({ type: 'varchar', length: 30 })
  audienceType: AudienceTargetType;

  @ApiProperty({ description: 'Audience target configuration' })
  @Column({ type: 'jsonb', nullable: true })
  audienceConfig: Record<string, any> | null;

  @ApiProperty({ description: 'Attachment URLs/metadata' })
  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{ fileName: string; url: string; mimeType: string }> | null;

  @ApiProperty({ description: 'Created by user ID' })
  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @OneToMany(() => AnnouncementRecipient, (r) => r.announcement, {
    cascade: true,
  })
  recipients: AnnouncementRecipient[];

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
