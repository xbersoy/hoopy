import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Account } from '../../account/entities/account.entity';
import { Contact } from '../../contact/entities/contact.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { UserRole } from '../../permissions/entities/user-role.entity';
import { UserRight } from '../../permissions/entities/user-right.entity';
import { PermissionGroupMembership } from '../../permissions/entities/permission-group-membership.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', nullable: false })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Column({ name: 'last_name', nullable: false })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Column({ unique: true, nullable: false })
  @IsEmail()
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken?: string;

  @ApiProperty({
    description: 'User settings',
    example: { ui: { theme: 'dark' } },
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true, default: {} })
  @IsOptional()
  settings?: Record<string, any>;

  @OneToOne(() => Account, (account) => account.owner)
  account?: Account;

  @OneToMany(() => Contact, (contact) => contact.user)
  contacts: Contact[];

  @OneToOne(() => Employee, (employee) => employee.user, { nullable: true })
  @JoinColumn()
  employee?: Employee;

  @OneToMany(() => UserRole, (ur) => ur.user)
  userRoles: UserRole[];

  @OneToMany(() => UserRight, (ur) => ur.user)
  userRights: UserRight[];

  @OneToMany(() => PermissionGroupMembership, (m) => m.user)
  permissionGroupMemberships: PermissionGroupMembership[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
