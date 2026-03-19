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
import { SurveyQuestion } from './survey-question.entity';

@Entity('survey_templates')
@Index('IDX_survey_template_company', ['companyId'])
export class SurveyTemplate {
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

  @ApiProperty({ description: 'Default survey title' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  defaultTitle: string | null;

  @ApiProperty({ description: 'Default survey instructions' })
  @Column({ type: 'text', nullable: true })
  defaultInstructions: string | null;

  @ApiProperty({ description: 'Whether responses are anonymous by default' })
  @Column({ type: 'boolean', default: true })
  defaultAnonymous: boolean;

  @ApiProperty({ description: 'Whether this template is active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Category/tag for organization' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @OneToMany(() => SurveyQuestion, (q) => q.surveyTemplate, { cascade: true })
  questions: SurveyQuestion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
