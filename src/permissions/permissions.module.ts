import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionRole } from './entities/permission-role.entity';
import { UserRole } from './entities/user-role.entity';
import { UserRight } from './entities/user-right.entity';
import { PermissionGroup } from './entities/permission-group.entity';
import {
  PermissionGroupMembership,
  PermissionGroupRole,
} from './entities/permission-group-membership.entity';
import { PeoplePool } from './entities/people-pool.entity';
import { PeoplePoolCondition } from './entities/people-pool-condition.entity';
import { Employee } from '../employee/entities/employee.entity';
import { PermissionsService } from './services/permissions.service';
import { PermissionRolesService } from './services/permission-roles.service';
import { PermissionGroupsService } from './services/permission-groups.service';
import { CustomObjectPermissionsService } from './services/custom-object-permissions.service';
import { PermissionsGuard } from './guards/permissions.guard';
import {
  TypeOrmPermissionRoleRepository,
  TypeOrmPermissionGroupRepository,
} from './permissions.repository';
import { PermissionsController } from './controllers/permissions.controller';
import { PermissionRolesController } from './controllers/permission-roles.controller';
import { PermissionGroupsController } from './controllers/permission-groups.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      PermissionRole,
      UserRole,
      UserRight,
      PermissionGroup,
      PermissionGroupMembership,
      PermissionGroupRole,
      PeoplePool,
      PeoplePoolCondition,
      Employee,
    ]),
  ],
  controllers: [
    PermissionsController,
    PermissionRolesController,
    PermissionGroupsController,
  ],
  providers: [
    PermissionsService,
    PermissionRolesService,
    PermissionGroupsService,
    CustomObjectPermissionsService,
    PermissionsGuard,
    {
      provide: 'PERMISSION_ROLE_REPOSITORY',
      useClass: TypeOrmPermissionRoleRepository,
    },
    {
      provide: 'PERMISSION_GROUP_REPOSITORY',
      useClass: TypeOrmPermissionGroupRepository,
    },
  ],
  exports: [PermissionsService, PermissionsGuard, CustomObjectPermissionsService],
})
export class PermissionsModule {}
