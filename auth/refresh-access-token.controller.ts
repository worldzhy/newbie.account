import {Controller, Get, Res} from '@nestjs/common';
import {ApiTags, ApiCookieAuth} from '@nestjs/swagger';
import {Response} from 'express';
import {Cookies} from '@framework/decorators/cookie.decorator';
import {CookieName} from '@microservices/account/security/cookie/cookie.service';
import {GuardByRefreshToken} from '@microservices/account/security/passport/refresh-token/refresh-token.decorator';
import {AuthService} from '@microservices/account/auth/auth.service';

@ApiTags('Account / Auth')
@Controller('auth')
export class RefreshAccessTokenController {
  constructor(private readonly authService: AuthService) {}

  @GuardByRefreshToken()
  @Get('refresh-access-token')
  @ApiCookieAuth()
  async refresh(@Cookies(CookieName.REFRESH_TOKEN) refreshToken: string, @Res({passthrough: true}) response: Response) {
    return await this.authService.refreshAccessToken({refreshToken, response});
  }

  /* End */
}
