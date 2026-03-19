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
import { Company } from '../../company/entities/company.entity';
import { SystemFeedbackCategory, FeedbackSensitivity } from '../enums';

@Entity('feedback_categories')
@Index('IDX_feedback_category_company', ['companyId'])
export class FeedbackCategory {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ description: 'Category code' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Display name' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: 'Description' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Icon identifier' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string | null;

  @ApiProperty({ description: 'Display color' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string | null;

  @ApiProperty({ description: 'Default sensitivity for this category' })
  @Column({
    type: 'varchar',
    length: 20,
    default: FeedbackSensitivity.NORMAL,
  })
  defaultSensitivity: FeedbackSensitivity;

  @ApiProperty({ description: 'Whether this is a system category' })
  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @ApiProperty({ description: 'Whether anonymous submissions are allowed' })
  @Column({ type: 'boolean', default: true })
  allowAnonymous: boolean;

  @ApiProperty({ description: 'Whether this category is active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Sort order' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Routing rules for this category' })
  @Column({ type: 'jsonb', nullable: true })
  routingRules: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
