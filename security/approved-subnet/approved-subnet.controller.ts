import {Controller, Delete, Get, Param, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {ApprovedSubnet, Prisma} from '@prisma/client';
import {CursorPipe} from '@framework/pipes/cursor.pipe';
import {OrderByPipe} from '@framework/pipes/order-by.pipe';
import {WherePipe} from '@framework/pipes/where.pipe';
import {Expose} from '../../account.helper';
import {ApprovedSubnetService} from './approved-subnet.service';

@ApiTags('Account / Approved Subnet')
@Controller('users/:userId/approved-subnets')
export class ApprovedSubnetController {
  constructor(private approvedSubnetsService: ApprovedSubnetService) {}

  /** Get approved subnets for a user */
  @Get()
  async getAll(
    @Param('userId') userId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('cursor', CursorPipe) cursor?: Prisma.ApprovedSubnetWhereUniqueInput,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>
  ): Promise<Expose<ApprovedSubnet>[]> {
    return this.approvedSubnetsService.getApprovedSubnets(userId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  /** Get an approved subnet for a user */
  @Get(':id')
  async get(
    @Param('userId') userId: string,
    @Param('id') id: number
  ): Promise<Expose<ApprovedSubnet>> {
    return this.approvedSubnetsService.getApprovedSubnet(userId, id);
  }

  /** Delete an approved subnet for a user */
  @Delete(':id')
  async remove(
    @Param('userId') userId: string,
    @Param('id') id: number
  ): Promise<Expose<ApprovedSubnet>> {
    return this.approvedSubnetsService.deleteApprovedSubnet(userId, id);
  }
}
