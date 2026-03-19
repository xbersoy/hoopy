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
import { User } from '../../user/entities/user.entity';

@Entity('feedback_messages')
@Index('IDX_feedback_message_item', ['feedbackItemId'])
export class FeedbackMessage {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'feedback_item_id', type: 'uuid' })
  feedbackItemId: string;

  @ManyToOne(() => FeedbackItem, (item) => item.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feedback_item_id' })
  feedbackItem: FeedbackItem;

  @ApiProperty({ description: 'Message content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'Whether this is an internal HR note' })
  @Column({ type: 'boolean', default: false })
  isInternal: boolean;

  @ApiProperty({ description: 'Whether this is from the system' })
  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @ApiProperty({ description: 'Author user ID (null for anonymous follow-up)' })
  @Column({ name: 'author_user_id', type: 'uuid', nullable: true })
  authorUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_user_id' })
  authorUser: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
