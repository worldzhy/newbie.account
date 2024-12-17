import {Controller, Get, Res} from '@nestjs/common';
import {ApiTags, ApiCookieAuth} from '@nestjs/swagger';
import {Response} from 'express';
import {Cookies} from '@framework/decorators/cookie.decorator';
import {CookieService} from './security/cookie/cookie.service';
import {SessionService} from './security/session/session.service';
import {TokenService} from './security/token/token.service';
import {GuardByRefreshToken} from './security/passport/refresh-token/refresh-token.decorator';

@ApiTags('Account')
@Controller('account')
export class LoginRefreshController {
  constructor(
    private readonly cookieService: CookieService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService
  ) {}

  @GuardByRefreshToken()
  @Get('refresh-access-token')
  @ApiCookieAuth()
  async refresh(
    @Cookies('refreshToken') refreshToken: string,
    @Res({passthrough: true}) response: Response
  ) {
    // [step 1]  Refresh
    const session = await this.sessionService.refresh(refreshToken);

    // [step 2] Send refresh token to cookie.
    const cookie = this.cookieService.generateForRefreshToken(
      session.refreshToken
    );

    response.cookie(cookie.name, cookie.value, cookie.options);

    // [step 3] Send access token as response.
    const accessTokenInfo = this.tokenService.verifyUserAccessToken(
      session.accessToken
    );

    return {
      token: session.accessToken,
      tokenExpiresInSeconds: accessTokenInfo.exp - accessTokenInfo.iat,
    };
  }

  /* End */
}
