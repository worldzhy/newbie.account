import {Controller, Post, Body, Res} from '@nestjs/common';
import {ApiTags, ApiBearerAuth, ApiBody} from '@nestjs/swagger';
import {Response} from 'express';
import {SessionService} from '@microservices/account/modules/session/session.service';
import {
  CookieName,
  DefaultCookieOptions,
} from '@microservices/account/security/cookie/cookie.constants';
import {LimitLoginByUserService} from '@microservices/account/security/rate-limiter/rate-limiter.service';

@ApiTags('Account / Auth')
@Controller('auth')
export class LogoutController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly limitLoginByUserService: LimitLoginByUserService
  ) {}

  @Post('logout')
  @ApiBearerAuth()
  @ApiBody({
    description: "The request body must contain 'userId' attribute.",
    examples: {
      a: {
        summary: '1. Log out',
        value: {
          userId: 'fd5c948e-d15d-48d6-a458-7798e4d9921c',
        },
      },
    },
  })
  async logout(
    @Body() body: {userId: string},
    @Res({passthrough: true}) response: Response
  ): Promise<{data: {message: string}}> {
    // [step 1] Invalidate all tokens.
    await this.sessionService.destroy(body.userId);

    // [step 2] Clear user attempts.
    await this.limitLoginByUserService.delete(body.userId);

    // [step 3] Clear cookie
    response.clearCookie(CookieName.REFRESH_TOKEN, DefaultCookieOptions);

    // [step 3] Always return success no matter if the user exists.
    return {
      data: {message: 'User logs out successfully'},
    };
  }

  /* End */
}
