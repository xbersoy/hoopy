import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { PermissionGroupMembership } from './permission-group-membership.entity';
import { PermissionGroupRole } from './permission-group-membership.entity';
import { PeoplePool } from './people-pool.entity';

@Entity('permission_groups')
@Unique(['name', 'companyId'])
export class PermissionGroup {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Group name', example: 'Engineering Team' })
  @Column({ length: 100, nullable: false })
  name: string;

  @ApiProperty({ description: 'Group description', required: false })
  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => PermissionGroupMembership, (m) => m.permissionGroup)
  memberships: PermissionGroupMembership[];

  @OneToMany(() => PermissionGroupRole, (r) => r.permissionGroup)
  groupRoles: PermissionGroupRole[];

  @OneToMany(() => PeoplePool, (p) => p.permissionGroup, { cascade: true })
  peoplePools: PeoplePool[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
