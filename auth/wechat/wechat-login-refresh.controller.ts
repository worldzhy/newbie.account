import {Body, Controller, Post} from '@nestjs/common';
import {ApiTags, ApiCookieAuth} from '@nestjs/swagger';
import {SessionService} from '@microservices/account/modules/session/session.service';
import {TokenService} from '@microservices/account/security/token/token.service';
import {GuardByWechatRefreshToken} from '@microservices/account/security/passport/wechat/wechat-refresh-token.decorator';

@ApiTags('Account / Auth / Wechat')
@Controller('auth/wechat')
export class WechatLoginRefreshController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService
  ) {}

  @GuardByWechatRefreshToken()
  @Post('refresh-access-token')
  @ApiCookieAuth()
  async refresh(@Body() body: {refreshToken: string}) {
    // [step 1]  Refresh
    const session = await this.sessionService.refresh(body.refreshToken);

    // [step 2] Send access token as response.
    const accessTokenInfo = this.tokenService.verifyUserAccessToken(
      session.accessToken
    );

    return {
      token: session.accessToken,
      tokenExpiresInSeconds: accessTokenInfo.exp - accessTokenInfo.iat,
      refreshToken: session.refreshToken,
    };
  }

  /* End */
}
