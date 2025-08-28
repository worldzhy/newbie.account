import {Controller, Post, Body, Res, Ip, Headers, Req} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {Response} from 'express';
import {AuthService} from '@microservices/account/auth/auth.service';
import {GuardByPassword} from '@microservices/account/security/passport/password/password.decorator';
import {UserRequest} from '@microservices/account/account.interface';
import {
  LimitLoginByIp,
  LimitLoginByUser,
} from '@microservices/account/security/rate-limiter/rate-limiter.decorator';
import {
  LoginByPasswordRequestDto,
  LoginByPasswordResponseDto,
} from '@microservices/account/auth/auth.dto';

@ApiTags('Account / Auth')
@Controller('auth')
export class LoginByPasswordController {
  constructor(private readonly authService: AuthService) {}

  /**
   * After a user is verified by auth guard, this 'login' function returns
   * a JWT to declare the user is authenticated.
   *
   * The 'account' parameter supports:
   * [1] account
   * [2] email
   * [3] phone
   */
  @Post('login-by-password')
  @LimitLoginByIp()
  @LimitLoginByUser()
  @GuardByPassword()
  @ApiBearerAuth()
  async loginByPassword(
    @Body() body: LoginByPasswordRequestDto, // Is it required for guard?
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
    @Req() request: UserRequest,
    @Res({passthrough: true}) response: Response
  ): Promise<LoginByPasswordResponseDto> {
    return await this.authService.login({
      ipAddress,
      userAgent,
      userId: request.user.userId,
      response,
    });
  }

  /* End */
}
