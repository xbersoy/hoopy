import { SetMetadata } from '@nestjs/common';
import { AdminPrivilege } from '../entities/admin-access.entity';

export const ADMIN_PRIVILEGE_KEY = 'required_admin_privilege';

export const RequireAdminPrivilege = (privilege: AdminPrivilege) =>
  SetMetadata(ADMIN_PRIVILEGE_KEY, privilege);
