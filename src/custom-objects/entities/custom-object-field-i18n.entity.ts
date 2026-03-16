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
import { CustomObjectField } from './custom-object-field.entity';

@Entity('custom_object_field_i18n')
@Unique('UQ_cof_i18n_field_locale', ['fieldId', 'locale'])
@Index('IDX_cof_i18n_company_locale', ['companyId', 'locale'])
export class CustomObjectFieldI18n {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'field_id', type: 'uuid' })
  fieldId: string;

  @ManyToOne(() => CustomObjectField, (field) => field.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'field_id' })
  field: CustomObjectField;

  @Column({ type: 'varchar', length: 35 })
  locale: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
