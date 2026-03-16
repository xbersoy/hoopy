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
  Unique,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Picklist } from './picklist.entity';
import { PicklistOptionI18n } from './picklist-option-i18n.entity';

@Entity('picklist_options')
@Unique('UQ_picklist_option_picklist_code', ['picklistId', 'code'])
export class PicklistOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'picklist_id', type: 'uuid' })
  @Index()
  picklistId: string;

  @ManyToOne(() => Picklist, (picklist) => picklist.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'picklist_id' })
  picklist: Picklist;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PicklistOptionI18n, (i18n) => i18n.picklistOption, {
    cascade: true,
  })
  translations: PicklistOptionI18n[];
}
