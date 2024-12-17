import {Injectable, CanActivate, ExecutionContext} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {PermissionAction, Prisma} from '@prisma/client';
import {PERMISSION_KEY} from './authorization.decorator';
import {PrismaService} from '@framework/prisma/prisma.service';
import {TokenService} from '../token/token.service';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // [step 1] Get required permission.
    const requiredPermission = this.reflector.getAllAndOverride<{
      resource: Prisma.ModelName;
      action: PermissionAction;
    }>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return true;
    }

    // [step 2] Parse JWT.
    const req = context.switchToHttp().getRequest();
    const accessToken = this.tokenService.getTokenFromHttpRequest(req);
    if (accessToken === undefined) {
      return false;
    }
    const payload = this.tokenService.verifyUserAccessToken(accessToken);

    // [step 3] Get user with organization and roles.
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {id: payload.userId},
      include: {memberships: true},
    });

    // [step 4-1] Get organization permissions.
    for (let i = 0; i < user.memberships.length; i++) {
      const organizationPermissions = await this.prisma.permission.findMany({
        where: {trustedMembershipId: user.memberships[i].id},
      });

      for (let i = 0; i < organizationPermissions.length; i++) {
        const permission = organizationPermissions[i];
        if (
          permission.resource === requiredPermission.resource &&
          (permission.action === requiredPermission.action ||
            permission.action === PermissionAction.Manage)
        ) {
          return true;
        }
      }
    }

    // [step 4-2] Get roles' permissions.

    if (user.roles.length > 0) {
      const rolePermissions = await this.prisma.permission.findMany({
        where: {trustedUserRole: {in: user.roles}},
      });

      for (let i = 0; i < rolePermissions.length; i++) {
        const permission = rolePermissions[i];
        if (
          permission.resource === requiredPermission.resource &&
          (permission.action === requiredPermission.action ||
            permission.action === PermissionAction.Manage)
        ) {
          return true;
        }
      }
    }

    // [step 4-3] Get user's permissions.
    const userPermissions = await this.prisma.permission.findMany({
      where: {trustedUserId: user.id},
    });

    for (let i = 0; i < userPermissions.length; i++) {
      const permission = userPermissions[i];
      if (
        permission.resource === requiredPermission.resource &&
        (permission.action === requiredPermission.action ||
          permission.action === PermissionAction.Manage)
      ) {
        return true;
      }
    }

    return false;
  }
}
