import {Controller, Get, Query, Param} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {PrismaService} from '@framework/prisma/prisma.service';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';

@ApiTags('Account / Audit Log')
@ApiBearerAuth()
@Controller()
export class AuditLogController {
  constructor(private prisma: PrismaService) {}

  /** Get audit logs for a team */
  @Get('organizations/:organizationId/audit-logs')
  async getAuditLogsByOrganization(
    @Param('organizationId') organizationId: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number
  ) {
    return await this.prisma.findManyInManyPages({
      model: Prisma.ModelName.AuditLog,
      pagination: {page, pageSize},
      findManyArgs: {where: {organizationId}, orderBy: {id: 'desc'}},
    });
  }

  /** Get audit logs for a user */
  @Get('users/:userId/audit-logs')
  async getAuditLogsByUser(
    @Param('userId') userId: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number
  ) {
    return await this.prisma.findManyInManyPages({
      model: Prisma.ModelName.AuditLog,
      pagination: {page, pageSize},
      findManyArgs: {where: {userId}, orderBy: {id: 'desc'}},
    });
  }
}
