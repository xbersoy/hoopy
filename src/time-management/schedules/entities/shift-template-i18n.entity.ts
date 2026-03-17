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
import { ShiftTemplate } from './shift-template.entity';

@Entity('shift_template_i18n')
@Unique('UQ_shift_template_i18n_template_locale', ['shiftTemplateId', 'locale'])
@Index('IDX_shift_template_i18n_company_locale', ['companyId', 'locale'])
export class ShiftTemplateI18n {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'shift_template_id', type: 'uuid' })
  shiftTemplateId: string;

  @ManyToOne(() => ShiftTemplate, (st) => st.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shift_template_id' })
  shiftTemplate: ShiftTemplate;

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
