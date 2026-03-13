import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { OrgUnit } from './org-unit.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('org_unit_links')
@Index('IDX_org_unit_link_company_from', ['companyId', 'fromOrgUnitId'])
@Index('IDX_org_unit_link_company_to', ['companyId', 'toOrgUnitId'])
@Unique('UQ_org_unit_link_company_from_to_type', [
  'companyId',
  'fromOrgUnitId',
  'toOrgUnitId',
  'linkType',
])
export class OrgUnitLink {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Company ID' })
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({ description: 'Source org unit ID' })
  @Column({ name: 'from_org_unit_id', type: 'uuid' })
  fromOrgUnitId: string;

  @ManyToOne(() => OrgUnit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_org_unit_id' })
  fromOrgUnit: OrgUnit;

  @ApiProperty({ description: 'Target org unit ID' })
  @Column({ name: 'to_org_unit_id', type: 'uuid' })
  toOrgUnitId: string;

  @ManyToOne(() => OrgUnit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_org_unit_id' })
  toOrgUnit: OrgUnit;

  @ApiProperty({ description: 'Link type', example: 'DOTTED_LINE' })
  @Column({ name: 'link_type', type: 'varchar', length: 100 })
  linkType: string;

  @ApiProperty({
    description: 'Whether this is the primary link',
    default: false,
  })
  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @ApiProperty({ description: 'Effective start date', required: false })
  @Column({ name: 'effective_start', type: 'timestamptz', nullable: true })
  effectiveStart: Date | null;

  @ApiProperty({ description: 'Effective end date', required: false })
  @Column({ name: 'effective_end', type: 'timestamptz', nullable: true })
  effectiveEnd: Date | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
