import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { UserRole } from '../../permissions/entities/user-role.entity';
import { UserService } from '../../user/user.service';
import { CompanyService } from '../../company/services/company.service';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { PermissionRolesService } from '../../permissions/services/permission-roles.service';
import { PermissionGroupsService } from '../../permissions/services/permission-groups.service';

const RESOURCE_TYPES = [
  'user',
  'employee',
  'company',
  'account',
  'contact',
  'org-unit',
  'org-unit-type',
  'permission-role',
  'permission-group',
  'attachment',
  'picklist',
  'custom-object-definition',
  'custom-object-record',
  'state-machine-definition',
  'workflow-definition',
  'workflow-instance',
  'leave-type',
  'leave-policy',
  'leave-request',
  'attendance-record',
  'attendance-correction',
  'schedule-template',
  'shift-template',
  'employee-schedule',
  'timesheet',
  'overtime-request',
  'skill-type',
  'skill',
  'competency',
  'competency-category',
  'feedback-category',
  'feedback-item',
  'feedback-request',
  'survey-template',
  'survey',
  'survey-response',
  'survey-analytics',
  'announcement',
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'publish'];

// ── Role definitions ────────────────────────────────────────────
const ROLE_DEFINITIONS: Array<{
  name: string;
  description: string;
  permissions: Record<string, string[]>;
}> = [
  {
    name: 'Super User',
    description: 'Full access to all resources',
    permissions: Object.fromEntries(
      RESOURCE_TYPES.map((r) => [r, [...ACTIONS]]),
    ),
  },
  {
    name: 'HR Manager',
    description: 'Manage employees, org structure, and permission groups',
    permissions: {
      employee: ['create', 'read', 'update', 'delete'],
      'org-unit': ['create', 'read', 'update', 'delete'],
      'org-unit-type': ['create', 'read', 'update', 'delete'],
      'permission-group': ['read', 'update'],
      picklist: ['create', 'read', 'update', 'delete'],
      'custom-object-definition': ['create', 'read', 'update', 'delete'],
      'custom-object-record': ['create', 'read', 'update', 'delete'],
      'state-machine-definition': ['create', 'read', 'update', 'delete'],
      'workflow-definition': ['create', 'read', 'update', 'delete'],
      'workflow-instance': ['create', 'read', 'update', 'delete'],
      'leave-type': ['create', 'read', 'update', 'delete'],
      'leave-policy': ['create', 'read', 'update', 'delete'],
      'leave-request': ['create', 'read', 'update', 'delete'],
      'attendance-record': ['create', 'read', 'update', 'delete'],
      'attendance-correction': ['create', 'read', 'update', 'delete'],
      'schedule-template': ['create', 'read', 'update', 'delete'],
      'shift-template': ['create', 'read', 'update', 'delete'],
      'employee-schedule': ['create', 'read', 'update', 'delete'],
      timesheet: ['create', 'read', 'update', 'delete'],
      'overtime-request': ['create', 'read', 'update', 'delete'],
      'skill-type': ['create', 'read', 'update', 'delete'],
      skill: ['create', 'read', 'update', 'delete'],
      competency: ['create', 'read', 'update', 'delete'],
      'competency-category': ['create', 'read', 'update', 'delete'],
      'feedback-category': ['create', 'read', 'update', 'delete'],
      'feedback-item': ['create', 'read', 'update', 'delete'],
      'feedback-request': ['create', 'read', 'update', 'delete', 'publish'],
      'survey-template': ['create', 'read', 'update', 'delete'],
      survey: ['create', 'read', 'update', 'delete', 'publish'],
      'survey-response': ['read'],
      'survey-analytics': ['read'],
      announcement: ['create', 'read', 'update', 'delete', 'publish'],
      company: ['read'],
      user: ['read'],
      contact: ['read'],
    },
  },
  {
    name: 'Employee Viewer',
    description: 'Read-only access to employees and org structure',
    permissions: {
      employee: ['read'],
      'org-unit': ['read'],
      'org-unit-type': ['read'],
      'workflow-instance': ['read'],
      'leave-request': ['create', 'read'],
      'attendance-record': ['create', 'read'],
      'attendance-correction': ['create', 'read'],
      'schedule-template': ['read'],
      'shift-template': ['read'],
      'employee-schedule': ['read'],
      timesheet: ['create', 'read'],
      'overtime-request': ['create', 'read'],
      'skill-type': ['read'],
      skill: ['read'],
      competency: ['read'],
      'competency-category': ['read'],
      'feedback-category': ['read'],
      'feedback-item': ['create', 'read'],
      'feedback-request': ['read'],
      'survey-template': ['read'],
      survey: ['read'],
      'survey-response': ['create', 'read'],
      announcement: ['read'],
    },
  },
  {
    name: 'Finance Manager',
    description: 'Manage employee records and company data',
    permissions: {
      employee: ['read', 'update'],
      company: ['read', 'update'],
      contact: ['create', 'read', 'update', 'delete'],
      attachment: ['create', 'read', 'update', 'delete'],
    },
  },
  {
    name: 'Account Admin',
    description: 'Manage account-level settings and preferences',
    permissions: {
      account: ['create', 'read', 'update', 'delete'],
      company: ['read', 'update'],
    },
  },
];

// ── Group definitions ───────────────────────────────────────────
const GROUP_DEFINITIONS: Array<{
  name: string;
  description: string;
  roleNames: string[];
  peoplePools?: Array<{
    poolType: 'included' | 'excluded';
    conditions: Array<{ field: string; values: string[] }>;
  }>;
}> = [
  {
    name: 'Engineering Team',
    description: 'All engineering department employees',
    roleNames: ['Employee Viewer'],
    peoplePools: [
      {
        poolType: 'included',
        conditions: [
          {
            field: 'department',
            values: [
              'Frontend',
              'Backend',
              'Infrastructure',
              'Mobile',
              'Quality Assurance',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'HR Team',
    description: 'Human resources team members',
    roleNames: ['HR Manager'],
    peoplePools: [
      {
        poolType: 'included',
        conditions: [
          { field: 'department', values: ['Recruiting', 'People Operations'] },
        ],
      },
    ],
  },
  {
    name: 'Finance Team',
    description: 'Finance and legal team members',
    roleNames: ['Finance Manager'],
    peoplePools: [
      {
        poolType: 'included',
        conditions: [{ field: 'department', values: ['Accounting', 'Legal'] }],
      },
    ],
  },
  {
    name: 'All Employees',
    description: 'Every employee in the company',
    roleNames: ['Employee Viewer'],
  },
  {
    name: 'Account Admins',
    description: 'Users who manage account-level settings',
    roleNames: ['Account Admin'],
  },
];

export class PermissionsSeeder implements Seeder {
  private readonly logger = new Logger(PermissionsSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    // Permission and UserRole have no service-layer create methods,
    // so we use repositories for those two entities only.
    const permissionRepo = app.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );
    const userRoleRepo = app.get<Repository<UserRole>>(
      getRepositoryToken(UserRole),
    );
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const permissionsService = app.get(PermissionsService);
    const permissionRolesService = app.get(PermissionRolesService);
    const permissionGroupsService = app.get(PermissionGroupsService);

    // 1. Seed global permissions
    for (const resourceType of RESOURCE_TYPES) {
      for (const action of ACTIONS) {
        const existing = await permissionRepo.findOne({
          where: { action, resourceType },
        });
        if (!existing) {
          await permissionRepo.save(
            permissionRepo.create({ action, resourceType }),
          );
          this.logger.log(`Created permission: ${action}:${resourceType}`);
        }
      }
    }

    const allPermissions = await permissionsService.findAll();
    this.logger.log(`Total permissions: ${allPermissions.length}`);

    const permissionMap = new Map(
      allPermissions.map((p) => [`${p.action}:${p.resourceType}`, p]),
    );

    // 2. Seed roles, groups, and assignments for each company owner
    const owners = [
      { email: 'admin@admin.com', label: 'Admin' },
      { email: 'manager@hoopy.com', label: 'Manager' },
    ];

    let users: any[] = [];
    try {
      users = await userService.findAll();
    } catch {
      // ignore
    }

    for (const owner of owners) {
      const user = users.find((u: any) => u.email === owner.email) ?? null;
      if (!user) {
        this.logger.warn(
          `${owner.label} user not found — skipping role/group seed.`,
        );
        continue;
      }

      let company = null;
      try {
        company = await companyService.findByOwner(user.id);
      } catch {
        // ignore
      }
      if (!company) {
        this.logger.warn(
          `${owner.label} company not found — skipping role/group seed.`,
        );
        continue;
      }

      this.logger.log(`Seeding roles and groups for ${company.name}...`);

      // ── Roles ───────────────────────────────────────────────────
      const createdRoles = new Map<string, any>();
      const existingRoles = await permissionRolesService.findAllByCompany(
        company.id,
      );

      for (const roleDef of ROLE_DEFINITIONS) {
        const existing = existingRoles.find((r) => r.name === roleDef.name);
        const permissionIds = Object.entries(roleDef.permissions).flatMap(
          ([resource, actions]) =>
            actions
              .map((a) => permissionMap.get(`${a}:${resource}`)?.id)
              .filter(Boolean) as string[],
        );

        if (existing) {
          // Sync permissions if the role already exists
          const existingPermIds = new Set(
            (existing.permissions ?? []).map((p: any) => p.id),
          );
          const missingIds = permissionIds.filter(
            (id) => !existingPermIds.has(id),
          );
          if (missingIds.length > 0) {
            const mergedIds = [
              ...(Array.from(existingPermIds) as string[]),
              ...missingIds,
            ];
            await permissionRolesService.update(
              existing.id,
              {
                name: existing.name,
                description: existing.description,
                permissionIds: mergedIds,
              },
              company.id,
            );
            this.logger.log(
              `  [${company.name}] Updated role "${roleDef.name}" (+${missingIds.length} permissions).`,
            );
          } else {
            this.logger.log(
              `  [${company.name}] Role "${roleDef.name}" already up to date.`,
            );
          }
          createdRoles.set(roleDef.name, existing);
        } else {
          const role = await permissionRolesService.create(
            {
              name: roleDef.name,
              description: roleDef.description,
              permissionIds,
            },
            company.id,
          );
          createdRoles.set(roleDef.name, role);
          this.logger.log(
            `  [${company.name}] Created role: ${roleDef.name} (${permissionIds.length} permissions)`,
          );
        }
      }

      // ── Assign Super User to the owner ──────────────────────────
      const superUserRole = createdRoles.get('Super User');
      if (superUserRole) {
        const existingAssignment = await userRoleRepo.findOne({
          where: {
            userId: user.id,
            permissionRoleId: superUserRole.id,
            companyId: company.id,
          },
        });

        if (!existingAssignment) {
          await userRoleRepo.save(
            userRoleRepo.create({
              userId: user.id,
              permissionRoleId: superUserRole.id,
              companyId: company.id,
            }),
          );
          this.logger.log(
            `  [${company.name}] Assigned "Super User" to ${owner.label}.`,
          );
        } else {
          this.logger.log(
            `  [${company.name}] ${owner.label} already has "Super User" role.`,
          );
        }
      }

      // ── Groups ──────────────────────────────────────────────────
      const existingGroups = await permissionGroupsService.findAllByCompany(
        company.id,
      );

      for (const groupDef of GROUP_DEFINITIONS) {
        const existing = existingGroups.find((g) => g.name === groupDef.name);
        if (existing) {
          this.logger.log(
            `  [${company.name}] Group "${groupDef.name}" already exists.`,
          );
          continue;
        }

        const permissionRoleIds = groupDef.roleNames
          .map((name) => createdRoles.get(name)?.id)
          .filter(Boolean) as string[];

        await permissionGroupsService.create(
          {
            name: groupDef.name,
            description: groupDef.description,
            permissionRoleIds,
            memberUserIds: [],
            peoplePools: groupDef.peoplePools,
          },
          company.id,
        );
        this.logger.log(`  [${company.name}] Created group: ${groupDef.name}`);
      }
    }
  }
}
