import {Body, Controller, Post} from '@nestjs/common';
import {ApiTags, ApiCookieAuth} from '@nestjs/swagger';
import {GuardByRefreshToken} from '@microservices/account/security/passport/refresh-token/refresh-token.decorator';
import {WechatAuthService} from './auth.service';

@ApiTags('Account / Auth / Wechat')
@Controller('auth/wechat')
export class WechatRefreshAccessTokenController {
  constructor(private readonly wechatAuthService: WechatAuthService) {}

  @GuardByRefreshToken()
  @Post('refresh-access-token')
  @ApiCookieAuth()
  async refresh(@Body() body: {refreshToken: string}) {
    return await this.wechatAuthService.refreshAccessToken({
      refreshToken: body.refreshToken,
    });
  }

  /* End */
}
