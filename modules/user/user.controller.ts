import {Controller, Delete, Get, Patch, Post, Body, Param, Query, BadRequestException} from '@nestjs/common';
import {ApiTags, ApiBearerAuth, ApiBody} from '@nestjs/swagger';
import {PermissionAction, Prisma, User, UserRole} from '@prisma/client';
import {RequirePermission} from '@microservices/account/security/authorization/authorization.decorator';
import {compareHash} from '@framework/utilities/common.util';
import {PrismaService} from '@framework/prisma/prisma.service';
import {UserService} from './user.service';

@ApiTags('Account / User')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService
  ) {}

  @Post('')
  @RequirePermission(PermissionAction.Create, Prisma.ModelName.User)
  async createUser(@Body() body: Prisma.UserCreateInput) {
    return await this.prisma.user.create({
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
    return await this.prisma.user.update({
      where: {id: userId},
      data: body,
    });
  }

  @Delete(':userId')
  @RequirePermission(PermissionAction.Delete, Prisma.ModelName.User)
  async deleteUser(@Param('userId') userId: string): Promise<User> {
    return await this.prisma.user.delete({
      where: {id: userId},
    });
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
