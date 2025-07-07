import {Controller, Post, Body, Ip} from '@nestjs/common';
import {ApiTags, ApiBody} from '@nestjs/swagger';
import {WechatAuthService} from '@microservices/account/auth/wechat/wechat-auth.service';
import {WechatSignupDto} from '@microservices/account/auth/wechat/wechat-auth.dto';
import {NoGuard} from '@microservices/account/security/passport/public/public.decorator';

@ApiTags('Account / Auth / Wechat')
@Controller('auth/wechat')
export class WechatSignupController {
  constructor(private readonly wechatAuthService: WechatAuthService) {}

  @NoGuard()
  @Post('signup')
  @ApiBody({
    description: 'Wechat phone signup',
    examples: {
      a: {
        summary: 'Sign up with phone',
        value: {phone: '13960068008', openId: 'xxxx'},
      },
    },
  })
  async signupWechat(@Ip() ipAddress: string, @Body() body: WechatSignupDto) {
    // [step 1] 微信电话注册用户，或者获取已有用户
    const user = await this.wechatAuthService.signUpOrLoginWechat({
      userData: body,
      ipAddress,
    });

    // [step 2] 微信登录并生成令牌
    const {token, tokenExpiresInSeconds, refreshToken} =
      await this.wechatAuthService.login({
        ipAddress,
        userAgent: 'mini-program',
        openId: user.wechatOpenId!,
      });

    // [step 3] 返回访问令牌
    return {token, tokenExpiresInSeconds, refreshToken, user};
  }

  /* End */
}
