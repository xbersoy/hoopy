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
import { OrgUnitType } from './org-unit-type.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('org_unit_type_i18n')
@Unique('UQ_org_unit_type_i18n_type_locale', ['orgUnitTypeId', 'locale'])
@Index('IDX_org_unit_type_i18n_company_locale', ['companyId', 'locale'])
@Index('IDX_org_unit_type_i18n_company_type', ['companyId', 'orgUnitTypeId'])
export class OrgUnitTypeI18n {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Company ID' })
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ description: 'Org unit type ID' })
  @Column({ name: 'org_unit_type_id', type: 'uuid' })
  orgUnitTypeId: string;

  @ManyToOne(() => OrgUnitType, (type) => type.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'org_unit_type_id' })
  orgUnitType: OrgUnitType;

  @ApiProperty({ description: 'BCP-47 locale string', example: 'en' })
  @Column({ type: 'varchar', length: 35 })
  locale: string;

  @ApiProperty({ description: 'Localized display name', example: 'Department' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'Optional short name for compact UI',
    required: false,
  })
  @Column({ name: 'short_name', type: 'varchar', length: 100, nullable: true })
  shortName: string | null;

  @ApiProperty({
    description: 'Optional localized description',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
