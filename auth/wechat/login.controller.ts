import {Controller, Post, Body, Res, Ip, Headers, Req} from '@nestjs/common';
import {ApiTags, ApiBody, ApiBearerAuth} from '@nestjs/swagger';
import {NoGuard} from '@microservices/account/security/passport/public/public.decorator';
import {Response} from 'express';
import {UserRequest} from '@microservices/account/account.interface';
import {AccountService} from '@microservices/account/account.service';
import {GuardByWechat} from '@microservices/account/security/passport/wechat/wechat.decorator';
import {
  WechatLoginDto,
  WechatOpenIdLoginDto,
} from '@microservices/account/account.dto';

@ApiTags('Account / Auth / Wechat')
@Controller('auth/wechat')
export class WechatLoginController {
  constructor(private readonly accountService: AccountService) {}

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
    // [step 1] openId获取已有用户
    const user = await this.accountService.getUserByOpenId({
      openId: body.openId,
      ipAddress,
    });

    // [step 2] 微信登录并生成令牌
    const {accessToken} = await this.accountService.login({
      ipAddress,
      userAgent: 'wechat-miniprogram',
      userId: user.id,
      skipEmailCheck: true,
      skipLocationCheck: true,
    });

    // [step 3] 返回访问令牌和用户信息
    return {accessToken, user};
  }

  /**
   * 微信小程序登录
   *
   * 使用微信临时登录凭证code获取用户的openid和unionid，
   * 并生成JWT令牌进行身份验证
   */
  @Post('login-by-code')
  @GuardByWechat()
  @ApiBearerAuth()
  @ApiBody({
    description: "微信登录接口，请求体必须包含微信临时登录凭证 'code'",
    type: WechatLoginDto,
    examples: {
      a: {
        summary: '微信小程序登录',
        value: {code: '临时登录凭证'},
      },
    },
  })
  async loginByWechatCode(
    @Body() body: WechatLoginDto,
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
    @Req() request: UserRequest,
    @Res({passthrough: true}) response: Response
  ): Promise<{token: string; tokenExpiresInSeconds: number}> {
    // [step 1] 微信登录并生成令牌
    const {accessToken, cookie} = await this.accountService.login({
      ipAddress,
      userAgent,
      userId: request.user.userId,
    });

    // [step 2] 发送刷新令牌到cookie
    response.cookie(cookie.name, cookie.value, cookie.options);

    // [step 3] 返回访问令牌
    return accessToken;
  }
}
