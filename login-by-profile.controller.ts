import {Controller, Post, Body, Res, Ip, Headers, Req} from '@nestjs/common';
import {ApiTags, ApiBearerAuth, ApiBody} from '@nestjs/swagger';
import {Response} from 'express';
import {AccountService} from './account.service';
import {GuardByProfile} from './security/passport/profile/profile.decorator';
import {GuardByUuid} from './security/passport/uuid/uuid.decorator';
import {UserRequest} from './account.interface';

@ApiTags('Account')
@Controller('account')
export class LoginByProfileController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * After a user is verified by auth guard, this 'login' function returns
   * a JWT to declare the user is authenticated.
   */
  @Post('login-by-profile')
  @GuardByProfile()
  @ApiBearerAuth()
  @ApiBody({
    description:
      "The request body should contain 'firstName', 'middleName', 'lastName' and 'dateOfBirth' attributes. The 'suffix' is optional.",
    examples: {
      a: {
        summary: '1. UserProfile with suffix',
        value: {
          firstName: 'Robert',
          middleName: 'William',
          lastName: 'Smith',
          suffix: 'PhD',
          dateOfBirth: '2019-05-27',
        },
      },
      b: {
        summary: '2. UserProfile without suffix',
        value: {
          firstName: 'Mary',
          middleName: 'Rose',
          lastName: 'Johnson',
          dateOfBirth: '2019-05-27',
        },
      },
    },
  })
  async loginByUserProfile(
    @Body()
    body: {
      firstName: string;
      middleName: string;
      lastName: string;
      suffix?: string;
      dateOfBirth: Date;
    },
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
    @Req() request: UserRequest,
    @Res({passthrough: true}) response: Response
  ): Promise<{token: string; tokenExpiresInSeconds: number}> {
    // [step 1] Login with userId and generate tokens.
    const {accessToken, cookie} = await this.accountService.login({
      ipAddress,
      userAgent,
      userId: request.user.userId,
    });

    // [step 2] Send refresh token to cookie.
    response.cookie(cookie.name, cookie.value, cookie.options);

    // [step 3] Send access token as response.
    return accessToken;
  }

  @Post('login-by-uuid')
  @GuardByUuid()
  @ApiBearerAuth()
  @ApiBody({
    description: 'Verfiy account by uuid.',
    examples: {
      a: {
        summary: '1. Valid uuid',
        value: {
          uuid: 'e51b4030-39ab-4420-bc87-2907acae824c',
        },
      },
    },
  })
  async loginByUuid(
    @Body() body: {uuid: string},
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
    @Req() request: UserRequest,
    @Res({passthrough: true}) response: Response
  ): Promise<{token: string; tokenExpiresInSeconds: number}> {
    // [step 1] Login with uuid and generate tokens.
    const {accessToken, cookie} = await this.accountService.login({
      ipAddress,
      userAgent,
      userId: request.user.userId,
    });

    // [step 2] Send refresh token to cookie.
    response.cookie(cookie.name, cookie.value, cookie.options);

    // [step 3] Send access token as response.
    return accessToken;
  }

  /* End */
}
