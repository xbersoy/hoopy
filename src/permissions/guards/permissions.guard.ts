import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../services/permissions.service';
import {
  PERMISSIONS_KEY,
  RequiredPermission,
} from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      RequiredPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!user.companyId) {
      throw new ForbiddenException(
        'You are not authorized to perform this action.',
      );
    }

    for (const perm of requiredPermissions) {
      const allowed = await this.permissionsService.userCan(
        user.id,
        user.companyId,
        perm.action,
        perm.resourceType,
      );
      if (!allowed) {
        throw new ForbiddenException(
          'You are not authorized to perform this action.',
        );
      }
    }

    return true;
  }
}
