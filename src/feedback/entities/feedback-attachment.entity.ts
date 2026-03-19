import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { FeedbackItem } from './feedback-item.entity';

@Entity('feedback_attachments')
@Index('IDX_feedback_attachment_item', ['feedbackItemId'])
export class FeedbackAttachment {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'feedback_item_id', type: 'uuid' })
  feedbackItemId: string;

  @ManyToOne(() => FeedbackItem, (item) => item.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'feedback_item_id' })
  feedbackItem: FeedbackItem;

  @ApiProperty({ description: 'Original filename' })
  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @ApiProperty({ description: 'File MIME type' })
  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Column({ type: 'int' })
  fileSize: number;

  @ApiProperty({ description: 'Storage path/key' })
  @Column({ type: 'varchar', length: 500 })
  storagePath: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
