import {BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req} from '@nestjs/common';
import {ApiBearerAuth, ApiBody, ApiTags} from '@nestjs/swagger';
import {PermissionAction, Prisma, User, UserRole} from '@generated/prisma/client';
import {RequirePermission} from '@microservices/account/security/authorization/authorization.decorator';
import {compareHash} from '@framework/utilities/common.util';
import {PrismaService} from '@framework/prisma/prisma.service';
import {TokenService} from '@microservices/account/security/token/token.service';
import {UserService} from './user.service';
import {Request} from 'express';

@ApiTags('Account / User')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('')
  @RequirePermission(PermissionAction.Create, Prisma.ModelName.User)
  async createUser(@Body() body: Prisma.UserCreateInput) {
    // [step 1] Create the user.
    const user = await this.prisma.user.create({
      data: body,
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        name: true,
        firstName: true,
        middleName: true,
        lastName: true,
      },
    });

    // [step 2] Automatically create Permission records for the new user so that
    // they can pass the @RequirePermission checks on User resource endpoints.
    // A Manage-level permission on a resource matches any action (Create, List,
    // Get, Update, Delete), giving the user full access to their own resource.
    //
    // The ADMIN role already bypasses all permission checks in AuthorizationGuard,
    // so these records are primarily useful for non-ADMIN (USER role) users.

    const permissionData: Prisma.PermissionCreateInput[] = [
      {
        action: PermissionAction.Manage,
        resource: Prisma.ModelName.User,
        trustedUserId: user.id,
      },
    ];

    for (const p of permissionData) {
      await this.prisma.permission.create({data: p});
    }

    return user;
  }

  @Get('')
  @RequirePermission(PermissionAction.List, Prisma.ModelName.User)
  async getUsers(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('name') name?: string,
    @Query('roles') roles?: UserRole[]
  ) {
    // [step 1] Construct where argument.
    let where: Prisma.UserWhereInput | undefined;
    const whereConditions: object[] = [];

    if (name) {
      name = name.trim();
      if (name.length > 0) {
        whereConditions.push({name: {search: name}});
      }
    }

    if (roles) {
      whereConditions.push({roles: {hasSome: roles}});
    }

    if (whereConditions.length > 1) {
      where = {OR: whereConditions};
    } else if (whereConditions.length === 1) {
      where = whereConditions[0];
    } else {
      // where === undefined
    }

    // [step 2] Get users.
    const result = await this.prisma.findManyInManyPages({
      model: Prisma.ModelName.User,
      pagination: {page, pageSize},
      findManyArgs: {where: where},
    });

    // [step 3] Return users without password.
    result.records = result.records.map(user => {
      return this.userService.withoutPassword(user);
    });

    return result;
  }

  @Get(':userId')
  @RequirePermission(PermissionAction.Get, Prisma.ModelName.User)
  async getUser(@Param('userId') userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {id: userId},
    });

    return this.userService.withoutPassword(user);
  }

  @Patch(':userId')
  @RequirePermission(PermissionAction.Update, Prisma.ModelName.User)
  @ApiBody({
    description: 'Set roleIds with an empty array to remove all the roles of the user.',
    examples: {
      a: {
        summary: '1. Update',
        value: {
          email: '',
          phone: '',
          firstName: '',
          middleName: '',
          lastName: '',
        },
      },
    },
  })
  async updateUser(@Param('userId') userId: string, @Body() body: Prisma.UserUpdateInput) {
    const user = await this.prisma.user.update({
      where: {id: userId},
      data: body,
    });

    // Strip the password hash from the response to prevent sensitive data leakage.
    return this.userService.withoutPassword(user);
  }

  @Delete(':userId')
  @RequirePermission(PermissionAction.Delete, Prisma.ModelName.User)
  async deleteUser(@Param('userId') userId: string, @Req() req: Request): Promise<Omit<User, 'password'>> {
    // Prevent users from deleting their own account.
    const token = this.tokenService.getTokenFromHttpRequest(req);
    if (token) {
      const payload = this.tokenService.verifyUserAccessToken(token);
      if (payload.userId === userId) {
        throw new BadRequestException('You cannot delete your own account.');
      }
    }

    const user = await this.prisma.user.delete({
      where: {id: userId},
    });

    // Strip the password hash from the response.
    return this.userService.withoutPassword(user);
  }

  @Patch(':userId/change-password')
  @RequirePermission(PermissionAction.Update, Prisma.ModelName.User)
  @ApiBody({
    description: "The 'userId', 'currentPassword' and 'newPassword' are required in request body.",
    examples: {
      a: {
        summary: '1. new password != current password',
        value: {
          currentPassword: '',
          newPassword: '',
        },
      },
      b: {
        summary: '2. new password == current password',
        value: {
          currentPassword: '',
          newPassword: '',
        },
      },
    },
  })
  async changePassword(@Param('userId') userId: string, @Body() body: {currentPassword: string; newPassword: string}) {
    // [step 1] Guard statement.
    if (!('currentPassword' in body) || !('newPassword' in body)) {
      throw new BadRequestException("Please carry 'currentPassword' and 'newPassword' in the request body.");
    }

    // [step 2] Verify if the new password is same with the current password.
    if (body.currentPassword.trim() === body.newPassword.trim()) {
      throw new BadRequestException('The new password is same with the current password.');
    }

    // [step 3] Verify the current password.
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {id: userId},
    });
    const match = await compareHash(body.currentPassword, user.password);
    if (match === false) {
      throw new BadRequestException('The current password is incorrect.');
    }

    // [step 4] Change password.
    return await this.prisma.user.update({
      where: {id: userId},
      data: {password: body.newPassword},
      select: {id: true, email: true, phone: true},
    });
  }

  /* End */
}
