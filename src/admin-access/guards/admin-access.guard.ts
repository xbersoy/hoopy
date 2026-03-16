import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminAccessService } from '../services/admin-access.service';
import { AccountService } from '../../account/services/account.service';
import { ADMIN_PRIVILEGE_KEY } from '../decorators/require-admin-privilege.decorator';
import { AdminPrivilege } from '../entities/admin-access.entity';

@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly adminAccessService: AdminAccessService,
    private readonly accountService: AccountService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPrivilege = this.reflector.getAllAndOverride<AdminPrivilege>(
      ADMIN_PRIVILEGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPrivilege) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!user.accountId) {
      throw new ForbiddenException(
        'You are not authorized to perform this action.',
      );
    }

    // Account owner has all admin privileges
    const account = await this.accountService.findByOwner(user.id);
    if (account && account.id === user.accountId) {
      return true;
    }

    // Check explicit admin privilege
    const hasPrivilege = await this.adminAccessService.userHasPrivilege(
      user.id,
      user.accountId,
      requiredPrivilege,
    );

    if (!hasPrivilege) {
      throw new ForbiddenException(
        'You are not authorized to perform this action.',
      );
    }

    return true;
  }
}
