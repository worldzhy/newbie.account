import {Controller, Get, Res} from '@nestjs/common';
import {ApiTags, ApiCookieAuth} from '@nestjs/swagger';
import {Response} from 'express';
import {GuardByRefreshToken} from './security/passport/refresh-token/refresh-token.decorator';
import {Cookies} from '@framework/decorators/cookie.decorator';
import {SessionService} from './security/session/session.service';
import {UserRefreshTokenService} from './security/session/refresh-token.service';
import {TokenService} from './security/token/token.service';

@ApiTags('Account')
@Controller('account')
export class LoginRefreshController {
  constructor(
    private readonly userRefreshTokenService: UserRefreshTokenService,
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
    const cookie = {
      name: this.userRefreshTokenService.cookieName,
      options: this.userRefreshTokenService.getCookieOptions(
        session.refreshToken
      ),
    };
    response.cookie(cookie.name, session.refreshToken, cookie.options);

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
