import { Injectable } from '@nestjs/common';
import { AssigneeStrategy } from '../enums/workflow.enums';
import {
  IAssigneeResolver,
  AssigneeResolutionContext,
  ResolvedAssignee,
} from './assignee-resolver.interface';

/**
 * Resolves assignees for the USER strategy.
 * Expects config: { userIds: string[] }
 */
@Injectable()
export class UserAssigneeResolver implements IAssigneeResolver {
  strategy = AssigneeStrategy.USER;

  async resolve(
    config: Record<string, any>,
    _context: AssigneeResolutionContext,
  ): Promise<ResolvedAssignee[]> {
    const userIds: string[] = config?.userIds || [];
    return userIds.map((userId) => ({ userId, resolvedVia: 'user' }));
  }
}

/**
 * Resolves assignees for the INITIATOR strategy.
 */
@Injectable()
export class InitiatorAssigneeResolver implements IAssigneeResolver {
  strategy = AssigneeStrategy.INITIATOR;

  async resolve(
    _config: Record<string, any>,
    context: AssigneeResolutionContext,
  ): Promise<ResolvedAssignee[]> {
    return [{ userId: context.initiatorId, resolvedVia: 'initiator' }];
  }
}

/**
 * Resolves assignees for the SUBJECT strategy.
 */
@Injectable()
export class SubjectAssigneeResolver implements IAssigneeResolver {
  strategy = AssigneeStrategy.SUBJECT;

  async resolve(
    _config: Record<string, any>,
    context: AssigneeResolutionContext,
  ): Promise<ResolvedAssignee[]> {
    if (!context.subjectId) return [];
    return [{ userId: context.subjectId, resolvedVia: 'subject' }];
  }
}

/**
 * Placeholder for MANAGER strategy.
 * In production, this would query the org structure / employee-manager relationships.
 * Expects context.subjectId to be set.
 */
@Injectable()
export class ManagerAssigneeResolver implements IAssigneeResolver {
  strategy = AssigneeStrategy.MANAGER;

  async resolve(
    _config: Record<string, any>,
    context: AssigneeResolutionContext,
  ): Promise<ResolvedAssignee[]> {
    // TODO: Integrate with employee/org-structure module to resolve direct manager
    // For now, check if managerId is provided in context data
    const managerId = context.contextData?.managerId;
    if (!managerId) return [];
    return [{ userId: managerId, resolvedVia: 'manager' }];
  }
}

/**
 * Placeholder for ROLE strategy.
 * Expects config: { roleName: string }
 * Would query PermissionRole → UserRole to find users with that role.
 */
@Injectable()
export class RoleAssigneeResolver implements IAssigneeResolver {
  strategy = AssigneeStrategy.ROLE;

  async resolve(
    config: Record<string, any>,
    context: AssigneeResolutionContext,
  ): Promise<ResolvedAssignee[]> {
    // TODO: Integrate with permissions module to resolve users by role
    // For now, check context data for pre-resolved role users
    const userIds: string[] = config?.userIds || context.contextData?.roleUserIds || [];
    return userIds.map((userId) => ({ userId, resolvedVia: `role:${config?.roleName}` }));
  }
}

/**
 * Placeholder for PERMISSION_GROUP strategy.
 * Expects config: { groupId: string }
 */
@Injectable()
export class PermissionGroupAssigneeResolver implements IAssigneeResolver {
  strategy = AssigneeStrategy.PERMISSION_GROUP;

  async resolve(
    config: Record<string, any>,
    context: AssigneeResolutionContext,
  ): Promise<ResolvedAssignee[]> {
    // TODO: Integrate with PermissionGroup → PermissionGroupMembership
    const userIds: string[] = config?.userIds || context.contextData?.groupUserIds || [];
    return userIds.map((userId) => ({
      userId,
      resolvedVia: `permission_group:${config?.groupId}`,
    }));
  }
}
