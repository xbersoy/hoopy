import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { OrgUnitTypeI18n } from './org-unit-type-i18n.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('org_unit_types')
@Unique('UQ_org_unit_type_company_slug', ['companyId', 'slug'])
export class OrgUnitType {
  @ApiProperty({ description: 'Unique identifier', example: 'a1b2c3d4-...' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Company ID this type belongs to' })
  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'URL-friendly slug, unique per company',
    example: 'department',
  })
  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @ApiProperty({
    description: 'Optional color for UI',
    example: '#3B82F6',
    required: false,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @ApiProperty({
    description: 'Optional icon identifier',
    example: 'building',
    required: false,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => OrgUnitTypeI18n, (i18n) => i18n.orgUnitType, {
    cascade: true,
    eager: false,
  })
  translations: OrgUnitTypeI18n[];
}
