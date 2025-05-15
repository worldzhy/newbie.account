import {Body, Controller, Get, Patch, Req} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {Request} from 'express';
import {AccountService} from './account.service';
import {Prisma} from '@prisma/client';

@ApiTags('Account')
@Controller('account')
export class MeController {
  constructor(private readonly accountService: AccountService) {}

  @Get('me')
  @ApiBearerAuth()
  async getCurrentUser(@Req() request: Request) {
    return await this.accountService.me(request);
  }

  @Patch('me')
  @ApiBearerAuth()
  async updateCurrentUser(
    @Req() request: Request,
    @Body() body: Prisma.UserUpdateInput
  ) {
    return await this.accountService.updateMe(request, body);
  }

  /* End */
}
