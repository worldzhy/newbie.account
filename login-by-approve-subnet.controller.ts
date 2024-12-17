import {
  Controller,
  Post,
  Body,
  Res,
  Ip,
  Headers,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {AccountService} from '@microservices/account/account.service';

import {ApprovedSubnetService} from './security/approved-subnet/approved-subnet.service';
import {TokenService} from './security/token/token.service';
import {TokenSubject} from './security/token/token.constants';
import {PrismaService} from '@framework/prisma/prisma.service';
import {
  NO_TOKEN_PROVIDED,
  USER_NOT_FOUND,
} from '@framework/exceptions/errors.constants';

@ApiTags('Account')
@Controller('account')
export class LoginByPasswordController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly approvedSubnetService: ApprovedSubnetService,
    private readonly tokenService: TokenService
  ) {}

  @Post('login-by-approve-subnet')
  async approveSubnet(
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
    @Body('token') token: string,
    @Res({passthrough: true}) response: Response
  ) {
    // [step 1] Verify token
    if (!token) throw new UnprocessableEntityException(NO_TOKEN_PROVIDED);
    const {userId} = this.tokenService.verify<{userId: string}>(token, {
      subject: TokenSubject.APPROVE_SUBNET_TOKEN,
    });

    const user = await this.prisma.user.findUnique({where: {id: userId}});
    if (!user) throw new NotFoundException(USER_NOT_FOUND);

    // [step 2] Approve new subnet
    await this.approvedSubnetService.approveNewSubnet(userId, ipAddress);

    // [step 3] Log in
    const {accessToken, cookie} = await this.accountService.login({
      ipAddress,
      userAgent,
      userId,
    });
    response.cookie(cookie.name, cookie.value, cookie.options);
    return accessToken;
  }

  /* End */
}
