import {
  Controller,
  Post,
  Body,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {TokenService} from './security/token/token.service';
import {TokenSubject} from './security/token/token.constants';
import {NoGuard} from './security/passport/public/public.decorator';
import {PrismaService} from '@framework/prisma/prisma.service';
import {
  NO_TOKEN_PROVIDED,
  EMAIL_NOT_FOUND,
} from '@framework/exceptions/errors.constants';

@ApiTags('Account')
@Controller('account')
export class SignupEmailVerifyController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService
  ) {}

  @Post('signup-email-verify')
  @NoGuard()
  async approveSubnet(@Body('token') token: string) {
    // [step 1] Verify token
    if (!token) throw new UnprocessableEntityException(NO_TOKEN_PROVIDED);
    const {id} = this.tokenService.verify<{id: number}>(token, {
      subject: TokenSubject.APPROVE_EMAIL_TOKEN,
    });

    if (!id) throw new NotFoundException(EMAIL_NOT_FOUND);

    // [step 2] Setting Email flag
    await this.prisma.email.update({
      where: {id},
      data: {isVerified: true},
    });
    return true;
  }

  /* End */
}
