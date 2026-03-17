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
import { Company } from '../../../company/entities/company.entity';
import { ScheduleTemplate } from './schedule-template.entity';

@Entity('schedule_template_i18n')
@Unique('UQ_schedule_template_i18n_template_locale', ['scheduleTemplateId', 'locale'])
@Index('IDX_schedule_template_i18n_company_locale', ['companyId', 'locale'])
export class ScheduleTemplateI18n {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'schedule_template_id', type: 'uuid' })
  scheduleTemplateId: string;

  @ManyToOne(() => ScheduleTemplate, (st) => st.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schedule_template_id' })
  scheduleTemplate: ScheduleTemplate;

  @Column({ type: 'varchar', length: 35 })
  locale: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
