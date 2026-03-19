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
import { FeedbackCategory } from './feedback-category.entity';
import { FeedbackSubmissionMode } from '../enums';

@Entity('feedback_request_templates')
@Index('IDX_feedback_request_template_company', ['companyId'])
export class FeedbackRequestTemplate {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ description: 'Template name' })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ApiProperty({ description: 'Template description' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Default title for requests using this template' })
  @Column({ type: 'varchar', length: 255 })
  defaultTitle: string;

  @ApiProperty({ description: 'Default instructions' })
  @Column({ type: 'text', nullable: true })
  defaultInstructions: string | null;

  @ApiProperty({ description: 'Default category ID' })
  @Column({ name: 'default_category_id', type: 'uuid', nullable: true })
  defaultCategoryId: string | null;

  @ManyToOne(() => FeedbackCategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'default_category_id' })
  defaultCategory: FeedbackCategory | null;

  @ApiProperty({ description: 'Default submission mode' })
  @Column({ type: 'varchar', length: 20, default: FeedbackSubmissionMode.IDENTIFIED })
  defaultSubmissionMode: FeedbackSubmissionMode;

  @ApiProperty({ description: 'Default days until due' })
  @Column({ type: 'int', nullable: true })
  defaultDueDays: number | null;

  @ApiProperty({ description: 'Whether this template is active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
