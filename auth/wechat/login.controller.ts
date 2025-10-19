import {Controller, Post, Body, Ip} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {WechatAuthService} from '@microservices/account/auth/wechat/auth.service';
import {WechatLoginDto} from '@microservices/account/auth/wechat/auth.dto';
import {NoGuard} from '@microservices/account/security/passport/public/public.decorator';

@ApiTags('Account / Auth / Wechat')
@Controller('auth/wechat')
export class WechatLoginController {
  constructor(private readonly wechatAuthService: WechatAuthService) {}

  @NoGuard()
  @Post('signup')
  async loginByWechat(@Ip() ipAddress: string, @Body() body: WechatLoginDto) {
    return await this.wechatAuthService.login({
      ipAddress,
      userAgent: 'mini-program',
      phone: body.phone,
      openId: body.openId,
    });
  }

  /* End */
}
