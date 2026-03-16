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
import { Picklist } from './picklist.entity';

@Entity('picklist_i18n')
@Unique('UQ_picklist_i18n_picklist_locale', ['picklistId', 'locale'])
@Index('IDX_picklist_i18n_company_locale', ['companyId', 'locale'])
export class PicklistI18n {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'picklist_id', type: 'uuid' })
  picklistId: string;

  @ManyToOne(() => Picklist, (picklist) => picklist.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'picklist_id' })
  picklist: Picklist;

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
