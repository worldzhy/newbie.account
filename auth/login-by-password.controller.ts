import {Controller, Post, Body, Res, Ip, Headers, Req} from '@nestjs/common';
import {ApiTags, ApiBearerAuth, ApiBody} from '@nestjs/swagger';
import {Response} from 'express';
import {AuthService} from '@microservices/account/auth/auth.service';
import {
  LimitLoginByIp,
  LimitLoginByUser,
} from '@microservices/account/security/rate-limiter/rate-limiter.decorator';
import {GuardByPassword} from '@microservices/account/security/passport/password/password.decorator';
import {UserRequest} from '@microservices/account/account.interface';

@ApiTags('Account / Auth')
@Controller('auth')
export class LoginByPasswordController {
  constructor(private readonly authService: AuthService) {}

  /**
   * After a user is verified by auth guard, this 'login' function returns
   * a JWT to declare the user is authenticated.
   *
   * The 'account' parameter supports:
   * [1] account
   * [2] email
   * [3] phone
   */
  @Post('login-by-password')
  @LimitLoginByIp()
  @LimitLoginByUser()
  @GuardByPassword()
  @ApiBearerAuth()
  @ApiBody({
    description:
      "The request body should contain 'account' and 'password' attributes.",
    examples: {
      a: {
        summary: '1. Log in with email',
        value: {account: 'admin@newbie.com', password: ''},
      },
      b: {
        summary: '2. Log in with phone',
        value: {account: '13960068008', password: ''},
      },
    },
  })
  async loginByPassword(
    @Body() body: {account: string; password: string}, // Is it required for guard?
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
    @Req() request: UserRequest,
    @Res({passthrough: true}) response: Response
  ): Promise<{token: string; tokenExpiresInSeconds: number}> {
    // [step 1] Login with password and generate tokens.
    const {accessToken, cookie} = await this.authService.login({
      ipAddress,
      userAgent,
      userId: request.user.userId,
    });

    // [step 2] Send refresh token to cookie.
    response.cookie(cookie.name, cookie.value, cookie.options);

    // [step 3] Send access token as response.
    return accessToken;
  }

  /* End */
}
