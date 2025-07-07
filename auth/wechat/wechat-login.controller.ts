import {Controller, Post, Body, Ip, Headers, Req} from '@nestjs/common';
import {ApiTags, ApiBody, ApiBearerAuth} from '@nestjs/swagger';
import {NoGuard} from '@microservices/account/security/passport/public/public.decorator';
import {WechatUserRequest} from '@microservices/account/auth/wechat/wechat-auth.interface';
import {WechatAuthService} from '@microservices/account/auth/wechat/wechat-auth.service';
import {GuardByWechatCode} from '@microservices/account/security/passport/wechat/wechat.decorator';
import {
  WechatCodeLoginDto,
  WechatOpenIdLoginDto,
} from '@microservices/account/auth/wechat/wechat-auth.dto';

@ApiTags('Account / Auth / Wechat')
@Controller('auth/wechat')
export class WechatLoginController {
  constructor(private readonly wechatAuthService: WechatAuthService) {}

  /**
   * 微信小程序登录
   *
   * 使用微信云开发获取用户的openid
   * 并生成JWT令牌进行身份验证
   */
  @NoGuard()
  @Post('login-by-openid')
  @ApiBody({
    description: '微信登录接口',
    type: WechatOpenIdLoginDto,
    examples: {
      a: {
        summary: '微信小程序登录',
        value: {openId: 'xxx'},
      },
    },
  })
  async loginByWechatOpenId(
    @Body() body: WechatOpenIdLoginDto,
    @Ip() ipAddress: string
  ) {
    return await this.wechatAuthService.login({
      ipAddress,
      userAgent: 'wechat-miniprogram',
      openId: body.openId,
    });
  }

  /**
   * 微信小程序登录
   *
   * 使用微信临时登录凭证code获取用户的openid和unionid，
   * 并生成JWT令牌进行身份验证
   */
  @Post('login-by-code')
  @GuardByWechatCode()
  @ApiBearerAuth()
  @ApiBody({
    description: "微信登录接口，请求体必须包含微信临时登录凭证 'code'",
    type: WechatCodeLoginDto,
    examples: {
      a: {
        summary: '微信小程序登录',
        value: {code: '临时登录凭证'},
      },
    },
  })
  async loginByWechatCode(
    @Body() body: WechatCodeLoginDto,
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
    @Req() request: WechatUserRequest
  ): Promise<{token: string; tokenExpiresInSeconds: number}> {
    // [step 1] 微信登录并生成令牌
    return await this.wechatAuthService.login({
      ipAddress,
      userAgent,
      openId: request.user.wechatOpenId,
    });
  }
}
