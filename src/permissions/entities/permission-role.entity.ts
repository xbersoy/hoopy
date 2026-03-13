import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { Permission } from './permission.entity';

@Entity('permission_roles')
@Unique(['name', 'companyId'])
export class PermissionRole {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Role name', example: 'HR Manager' })
  @Column({ length: 100, nullable: false })
  name: string;

  @ApiProperty({ description: 'Role description', required: false })
  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    description: 'Permissions assigned to this role',
    type: () => [Permission],
  })
  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'permission_role_rights',
    joinColumn: { name: 'permission_role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
