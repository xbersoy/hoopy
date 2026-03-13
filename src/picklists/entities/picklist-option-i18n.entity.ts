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
import { Company } from '../../company/entities/company.entity';
import { PicklistOption } from './picklist-option.entity';

@Entity('picklist_option_i18n')
@Unique('UQ_picklist_option_i18n_option_locale', ['picklistOptionId', 'locale'])
@Index('IDX_picklist_opt_i18n_company_locale', ['companyId', 'locale'])
export class PicklistOptionI18n {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'picklist_option_id', type: 'uuid' })
  picklistOptionId: string;

  @ManyToOne(() => PicklistOption, (option) => option.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'picklist_option_id' })
  picklistOption: PicklistOption;

  @Column({ type: 'varchar', length: 35 })
  locale: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
