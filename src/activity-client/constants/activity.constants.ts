/**
 * Controlled set of activity categories matching activity-service enums.
 */
export enum ActivityCategory {
  AUTH = 'AUTH',
  USER = 'USER',
  ACCOUNT = 'ACCOUNT',
  COMPANY = 'COMPANY',
  EMPLOYEE = 'EMPLOYEE',
  PERMISSIONS = 'PERMISSIONS',
  ORG_STRUCTURE = 'ORG_STRUCTURE',
  CUSTOM_OBJECTS = 'CUSTOM_OBJECTS',
  ATTACHMENTS = 'ATTACHMENTS',
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  SYSTEM = 'SYSTEM',
}

export enum ActorType {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  INTERNAL_SERVICE = 'INTERNAL_SERVICE',
}

/**
 * Stable, dot-namespaced action identifiers.
 * Format: <domain>.<entity>.<verb> or <domain>.<verb>
 */
export const ActivityActions = {
  // Auth
  AUTH_LOGIN_SUCCEEDED: 'auth.login.succeeded',
  AUTH_LOGIN_FAILED: 'auth.login.failed',
  AUTH_LOGOUT_SUCCEEDED: 'auth.logout.succeeded',
  AUTH_PASSWORD_CHANGED: 'auth.password.changed',
  AUTH_INVITATION_ACCEPTED: 'auth.invitation.accepted',

  // User
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DEACTIVATED: 'user.deactivated',
  USER_ACTIVATED: 'user.activated',

  // Account
  ACCOUNT_CREATED: 'account.created',
  ACCOUNT_UPDATED: 'account.updated',

  // Company
  COMPANY_CREATED: 'company.created',
  COMPANY_UPDATED: 'company.updated',

  // Employee
  EMPLOYEE_CREATED: 'employee.created',
  EMPLOYEE_UPDATED: 'employee.updated',
  EMPLOYEE_DELETED: 'employee.deleted',
  EMPLOYEE_ARCHIVED: 'employee.archived',
  EMPLOYEE_RESTORED: 'employee.restored',

  // Permissions
  PERMISSION_ROLE_CREATED: 'permission-role.created',
  PERMISSION_ROLE_UPDATED: 'permission-role.updated',
  PERMISSION_ROLE_ASSIGNED: 'permission-role.assigned',
  PERMISSION_ROLE_REMOVED: 'permission-role.removed',
  PERMISSION_GROUP_CREATED: 'permission-group.created',
  PERMISSION_GROUP_UPDATED: 'permission-group.updated',

  // Admin Access
  ADMIN_ACCESS_GRANTED: 'admin-access.granted',
  ADMIN_ACCESS_REVOKED: 'admin-access.revoked',

  // Org Structure
  ORG_UNIT_CREATED: 'org-unit.created',
  ORG_UNIT_UPDATED: 'org-unit.updated',
  ORG_UNIT_MOVED: 'org-unit.moved',
  ORG_UNIT_DEACTIVATED: 'org-unit.deactivated',

  // Attachments
  ATTACHMENT_UPLOADED: 'attachment.uploaded',
  ATTACHMENT_DELETED: 'attachment.deleted',

  // Custom Objects
  CUSTOM_DEFINITION_CREATED: 'custom-definition.created',
  CUSTOM_DEFINITION_UPDATED: 'custom-definition.updated',
  CUSTOM_DEFINITION_DEACTIVATED: 'custom-definition.deactivated',
  CUSTOM_RECORD_CREATED: 'custom-record.created',
  CUSTOM_RECORD_UPDATED: 'custom-record.updated',
  CUSTOM_RECORD_DELETED: 'custom-record.deleted',
} as const;
