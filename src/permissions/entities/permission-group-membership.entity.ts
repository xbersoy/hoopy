import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { PermissionGroup } from './permission-group.entity';
import { PermissionRole } from './permission-role.entity';

@Entity('permission_group_memberships')
@Unique(['permissionGroupId', 'userId'])
export class PermissionGroupMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'permission_group_id' })
  permissionGroupId: string;

  @ManyToOne(() => PermissionGroup, (g) => g.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_group_id' })
  permissionGroup: PermissionGroup;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('permission_group_roles')
@Unique(['permissionGroupId', 'permissionRoleId'])
export class PermissionGroupRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'permission_group_id' })
  permissionGroupId: string;

  @ManyToOne(() => PermissionGroup, (g) => g.groupRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_group_id' })
  permissionGroup: PermissionGroup;

  @Column({ name: 'permission_role_id' })
  permissionRoleId: string;

  @ManyToOne(() => PermissionRole, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_role_id' })
  permissionRole: PermissionRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
