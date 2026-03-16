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
import { CustomObjectDefinition } from './custom-object-definition.entity';

@Entity('custom_object_definition_i18n')
@Unique('UQ_cod_i18n_definition_locale', ['definitionId', 'locale'])
@Index('IDX_cod_i18n_company_locale', ['companyId', 'locale'])
export class CustomObjectDefinitionI18n {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'definition_id', type: 'uuid' })
  definitionId: string;

  @ManyToOne(() => CustomObjectDefinition, (def) => def.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'definition_id' })
  definition: CustomObjectDefinition;

  @Column({ type: 'varchar', length: 35 })
  locale: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'plural_name', type: 'varchar', length: 255, nullable: true })
  pluralName: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
