import {Controller, Post, Body, Ip} from '@nestjs/common';
import {ApiTags, ApiBody} from '@nestjs/swagger';
import {AuthService} from '@microservices/account/auth/auth.service';
import {SignUpDto} from '@microservices/account/account.dto';
import {NoGuard} from '@microservices/account/security/passport/public/public.decorator';

@ApiTags('Account / Auth')
@Controller('auth')
export class SignupController {
  constructor(private readonly authService: AuthService) {}

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
        value: {email: 'email@example.com', password: ''},
      },
      b: {
        summary: '2. Sign up with phone',
        value: {phone: '13960068008'},
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
    await this.authService.signup({userData: body, ipAddress});
  }

  /* End */
}
