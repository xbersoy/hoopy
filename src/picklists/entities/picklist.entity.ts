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
import { PicklistI18n } from './picklist-i18n.entity';
import { PicklistOption } from './picklist-option.entity';

@Entity('picklists')
@Unique('UQ_picklist_company_code', ['companyId', 'code'])
export class Picklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PicklistI18n, (i18n) => i18n.picklist, { cascade: true })
  translations: PicklistI18n[];

  @OneToMany(() => PicklistOption, (option) => option.picklist, { cascade: true })
  options: PicklistOption[];
}
