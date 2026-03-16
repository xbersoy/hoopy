import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserRight } from '../entities/user-right.entity';
import {
  PermissionGroupMembership,
  PermissionGroupRole,
} from '../entities/permission-group-membership.entity';
import { PermissionGroup } from '../entities/permission-group.entity';
import { PeoplePool } from '../entities/people-pool.entity';
import { Employee } from '../../employee/entities/employee.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(UserRight)
    private readonly userRightRepo: Repository<UserRight>,
    @InjectRepository(PermissionGroupMembership)
    private readonly groupMembershipRepo: Repository<PermissionGroupMembership>,
    @InjectRepository(PermissionGroupRole)
    private readonly groupRoleRepo: Repository<PermissionGroupRole>,
    @InjectRepository(PermissionGroup)
    private readonly permissionGroupRepo: Repository<PermissionGroup>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  /**
   * List all available permissions (global).
   */
  findAll(): Promise<Permission[]> {
    return this.permissionRepo.find({
      order: { resourceType: 'ASC', action: 'ASC' },
    });
  }

  /**
   * Check if a user can perform `action` on `resourceType`.
   *
   * Three authorization paths (OR logic):
   *   1. Direct user rights
   *   2. Role-based (user -> role -> permission)
   *   3. Group-based (explicit membership OR people pool match -> group roles -> permissions)
   */
  async userCan(
    userId: string,
    companyId: string,
    action: string,
    resourceType: string,
  ): Promise<boolean> {
    const permission = await this.permissionRepo.findOne({
      where: { action, resourceType },
    });

    if (!permission) return false;

    // 1. Direct user right
    const directRight = await this.userRightRepo.findOne({
      where: { userId, permissionId: permission.id, companyId },
    });
    if (directRight) return true;

    // 2. Role-based
    const userRoles = await this.userRoleRepo.find({
      where: { userId, companyId },
      relations: ['permissionRole', 'permissionRole.permissions'],
    });
    for (const ur of userRoles) {
      if (ur.permissionRole.permissions.some((p) => p.id === permission.id)) {
        return true;
      }
    }

    // 3. Group-based
    const groupIds = await this.resolveUserGroupIds(userId, companyId);
    if (groupIds.length > 0) {
      const groupRoles = await this.groupRoleRepo
        .createQueryBuilder('gr')
        .leftJoinAndSelect('gr.permissionRole', 'role')
        .leftJoinAndSelect('role.permissions', 'perm')
        .where('gr.permissionGroupId IN (:...groupIds)', { groupIds })
        .getMany();

      for (const gr of groupRoles) {
        if (gr.permissionRole.permissions.some((p) => p.id === permission.id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get all permissions for a given user (union of direct + role-based + group-based).
   */
  async getUserPermissions(
    userId: string,
    companyId: string,
  ): Promise<Permission[]> {
    const permMap = new Map<string, Permission>();

    // 1. Direct user rights
    const directRights = await this.userRightRepo.find({
      where: { userId, companyId },
      relations: ['permission'],
    });
    for (const r of directRights) {
      permMap.set(r.permission.id, r.permission);
    }

    // 2. Role-based
    const userRoles = await this.userRoleRepo.find({
      where: { userId, companyId },
      relations: ['permissionRole', 'permissionRole.permissions'],
    });
    for (const ur of userRoles) {
      for (const p of ur.permissionRole.permissions) {
        permMap.set(p.id, p);
      }
    }

    // 3. Group-based
    const groupIds = await this.resolveUserGroupIds(userId, companyId);
    if (groupIds.length > 0) {
      const groupRoles = await this.groupRoleRepo
        .createQueryBuilder('gr')
        .leftJoinAndSelect('gr.permissionRole', 'role')
        .leftJoinAndSelect('role.permissions', 'perm')
        .where('gr.permissionGroupId IN (:...groupIds)', { groupIds })
        .getMany();

      for (const gr of groupRoles) {
        for (const p of gr.permissionRole.permissions) {
          permMap.set(p.id, p);
        }
      }
    }

    return Array.from(permMap.values());
  }

  /**
   * Resolve all permission group IDs a user belongs to
   * (explicit membership + people pool evaluation).
   */
  public async resolveUserGroupIds(
    userId: string,
    companyId: string,
  ): Promise<string[]> {
    const groupIds = new Set<string>();

    // Explicit memberships
    const memberships = await this.groupMembershipRepo.find({
      where: { userId },
      relations: ['permissionGroup'],
    });
    for (const m of memberships) {
      if (m.permissionGroup.companyId === companyId) {
        groupIds.add(m.permissionGroupId);
      }
    }

    // People pool evaluation
    const poolGroupIds = await this.evaluatePeoplePools(userId, companyId);
    for (const gid of poolGroupIds) {
      groupIds.add(gid);
    }

    return Array.from(groupIds);
  }

  /**
   * Evaluate people pool conditions against the user's employee record
   * and return matching permission group IDs.
   */
  private async evaluatePeoplePools(
    userId: string,
    companyId: string,
  ): Promise<string[]> {
    const employee = await this.employeeRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!employee) return [];

    const groups = await this.permissionGroupRepo.find({
      where: { companyId },
      relations: ['peoplePools', 'peoplePools.conditions'],
    });

    const matchedGroupIds: string[] = [];

    for (const group of groups) {
      const includedPools = group.peoplePools.filter(
        (p) => p.poolType === 'included',
      );
      const excludedPools = group.peoplePools.filter(
        (p) => p.poolType === 'excluded',
      );

      // If there are no pools at all, skip (group doesn't use pool-based membership)
      if (includedPools.length === 0 && excludedPools.length === 0) continue;

      const isIncluded =
        includedPools.length === 0 ||
        includedPools.some((pool) => this.matchesPool(employee, pool));

      const isExcluded = excludedPools.some((pool) =>
        this.matchesPool(employee, pool),
      );

      if (isIncluded && !isExcluded) {
        matchedGroupIds.push(group.id);
      }
    }

    return matchedGroupIds;
  }

  /**
   * Check if an employee matches all conditions in a pool (AND logic).
   */
  private matchesPool(employee: Employee, pool: PeoplePool): boolean {
    return pool.conditions.every((condition) => {
      const fieldValue = employee[condition.field as keyof Employee];
      if (fieldValue === undefined || fieldValue === null) return false;
      return condition.values.includes(String(fieldValue));
    });
  }

  /**
   * Check if a given set of permission IDs includes a specific action+resourceType.
   * Returns true if the permission doesn't exist (no restriction defined).
   */
  async hasPermissionByResourceType(
    userPermissionIds: string[],
    action: string,
    resourceType: string,
  ): Promise<boolean> {
    const perm = await this.permissionRepo.findOne({
      where: { action, resourceType },
    });
    if (!perm) return true; // No permission record means no restriction
    return userPermissionIds.includes(perm.id);
  }
}
