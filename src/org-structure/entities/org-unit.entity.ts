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
import { OrgUnitStatus } from '../enums/org-unit-status.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('org_units')
@Index('IDX_org_unit_company_parent', ['companyId', 'parentId'])
@Index('IDX_org_unit_company_path', ['companyId', 'path'])
@Unique('UQ_org_unit_company_parent_name', ['companyId', 'parentId', 'name'])
export class OrgUnit {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Company ID' })
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'Parent org unit ID (null for root)',
    required: false,
  })
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => OrgUnit, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: OrgUnit | null;

  @ApiProperty({ description: 'Org unit type ID', required: false })
  @Column({ name: 'type_id', type: 'uuid', nullable: true })
  typeId: string | null;

  @ManyToOne(() => OrgUnitType, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'type_id' })
  type: OrgUnitType | null;

  @ApiProperty({ description: 'Name of the org unit', example: 'Engineering' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Short code', example: 'ENG', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string | null;

  @ApiProperty({ description: 'Description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Status',
    enum: OrgUnitStatus,
    example: OrgUnitStatus.ACTIVE,
  })
  @Column({ type: 'enum', enum: OrgUnitStatus, default: OrgUnitStatus.ACTIVE })
  status: OrgUnitStatus;

  @ApiProperty({ description: 'Display order among siblings', required: false })
  @Column({ name: 'sort_order', type: 'int', nullable: true })
  sortOrder: number | null;

  @ApiProperty({ description: 'Materialized path, e.g. /<uuid>/<uuid>/' })
  @Column({ type: 'varchar', length: 2048, default: '' })
  path: string;

  @ApiProperty({ description: 'Depth in the tree (0 = root)' })
  @Column({ type: 'int', default: 0 })
  @Index('IDX_org_unit_depth')
  depth: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
