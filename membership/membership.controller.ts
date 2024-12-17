import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {Membership, Prisma} from '@prisma/client';
import {PrismaService} from '@framework/prisma/prisma.service';
import {ApiTags, ApiResponse} from '@nestjs/swagger';
import {Expose, expose} from '../account.helper';
import {AuditLog} from '../audit-logs/audit-log.decorator';
import {CreateMembershipDto, UpdateMembershipDto} from './membership.dto';
import {MembershipService} from './membership.service';
import {MembershipsListReqDto, MembershipsListResDto} from './membership.dto';

@ApiTags('Memberships')
@Controller('organizations/:organizationId/memberships')
export class MembershipController {
  constructor(
    private membershipService: MembershipService,
    private prisma: PrismaService
  ) {}

  /** Add a member to a team */
  @Post()
  @AuditLog('add-membership')
  async create(
    @Ip() ipAddress: string,
    @Param('organizationId') organizationId: string,
    @Body() data: CreateMembershipDto
  ): Promise<Expose<Membership>> {
    return this.membershipService.create({ipAddress, organizationId, ...data});
  }

  /** Get memberships for a team */
  @Get()
  @ApiResponse({
    type: MembershipsListResDto,
  })
  async getAll(
    @Param('organizationId') organizationId: string,
    @Query() query: MembershipsListReqDto
  ): Promise<MembershipsListResDto> {
    const {page, pageSize} = query;
    const result = await this.prisma.findManyInManyPages({
      model: Prisma.ModelName.Membership,
      pagination: {page, pageSize},
      findManyArgs: {
        where: {organizationId},
        orderBy: {id: 'desc'},
        include: {organization: true, user: {select: {email: true}}},
      },
    });

    result.records = result.records.map(membership =>
      expose<Membership>(membership)
    );
    return result;
  }

  /** Get a membership for a team */
  @Get(':id')
  async get(
    @Param('organizationId') organizationId: string,
    @Param('id', ParseIntPipe) id: number
  ): Promise<Expose<Membership>> {
    return this.membershipService.get(organizationId, id);
  }

  /** Update a membership for a team */
  @Patch(':id')
  @AuditLog('update-membership')
  async update(
    @Body() data: UpdateMembershipDto,
    @Param('organizationId') organizationId: string,
    @Param('id', ParseIntPipe) id: number
  ): Promise<Expose<Membership>> {
    return this.membershipService.update(organizationId, id, data);
  }

  /** Remove a member from a team */
  @Delete(':id')
  @AuditLog('delete-membership')
  async remove(
    @Param('organizationId') organizationId: string,
    @Param('id', ParseIntPipe) id: number
  ): Promise<Expose<Membership>> {
    return this.membershipService.delete(organizationId, id);
  }
}
