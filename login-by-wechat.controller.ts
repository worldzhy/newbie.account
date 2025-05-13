import {Controller, Post, Body, Res, Ip, Headers, Req} from '@nestjs/common';
import {ApiTags, ApiBody, ApiBearerAuth} from '@nestjs/swagger';
import {Response} from 'express';
import {AccountService} from '@microservices/account/account.service';
import {GuardByWechat} from '@microservices/account/security/passport/wechat/wechat.decorator';
import {UserRequest} from './account.interface';

export class WechatLoginDto {
  /**
   * 微信登录临时凭证
   */
  code: string;
}

@ApiTags('Account')
@Controller('account')
export class LoginByWechatController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * 微信小程序登录
   *
   * 使用微信临时登录凭证code获取用户的openid和unionid，
   * 并生成JWT令牌进行身份验证
   */
  @Post('login-by-wechat')
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
  async loginByWechat(
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
