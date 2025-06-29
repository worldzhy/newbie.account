import {Controller, Post, Body, Ip, Headers} from '@nestjs/common';
import {ApiTags, ApiBody} from '@nestjs/swagger';
import {AccountService} from '@microservices/account/account.service';
import {SignUpDto, SignUpWechatDto} from '@microservices/account/account.dto';
import {NoGuard} from '@microservices/account/security/passport/public/public.decorator';

@ApiTags('Account / Auth')
@Controller('auth')
export class SignupController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * Sign up by:
   * [1] email: password is optional
   * [2] phone: password is optional
   *
   * [Constraint] 'password' is required if neither email nor phone is provided.
   */
  @NoGuard()
  @Post('signup')
  @ApiBody({
    description:
      "The request body should contain at least one of the three attributes ['email', 'phone'].",
    examples: {
      a: {
        summary: '1. Sign up with email',
        value: {
          email: 'email@example.com',
          password: '',
        },
      },
      b: {
        summary: '2. Sign up with phone',
        value: {
          phone: '13960068008',
        },
      },
      c: {
        summary: '3. Sign up with profile',
        value: {
          prefix: 'Mr',
          firstName: 'Robert',
          middleName: 'William',
          lastName: 'Smith',
          suffix: 'PhD',
          dateOfBirth: '2019-05-27',
        },
      },
    },
  })
  async signup(@Ip() ipAddress: string, @Body() body: SignUpDto) {
    await this.accountService.signup({userData: body, ipAddress});
  }

  @NoGuard()
  @Post('signup-wechat')
  @ApiBody({
    description: 'Wechat phone signup',
    examples: {
      a: {
        summary: 'Sign up with phone',
        value: {
          phone: '13960068008',
          openId: 'xxxx',
        },
      },
    },
  })
  async signupWechat(
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
    @Body() body: SignUpWechatDto
  ) {
    // [step 1] 微信电话注册用户，或者获取已有用户
    const user = await this.accountService.signUpOrLoginWechat({
      userData: body,
      ipAddress,
    });
    // [step 2] 微信登录并生成令牌
    const {accessToken} = await this.accountService.login({
      ipAddress,
      userAgent,
      userId: user.id,
      isSkipCheck: true,
    });
    // [step 3] 返回访问令牌
    return {accessToken, user};
  }

  /* End */
}
