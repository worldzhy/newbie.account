import {Controller, Get, Res} from '@nestjs/common';
import {ApiTags, ApiCookieAuth} from '@nestjs/swagger';
import {Response} from 'express';
import {Cookies} from '@framework/decorators/cookie.decorator';
import {SessionService} from '@microservices/account/modules/session/session.service';
import {CookieService} from '@microservices/account/security/cookie/cookie.service';
import {TokenService} from '@microservices/account/security/token/token.service';
import {GuardByRefreshToken} from '@microservices/account/security/passport/refresh-token/refresh-token.decorator';

@ApiTags('Account / Auth')
@Controller('auth')
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
