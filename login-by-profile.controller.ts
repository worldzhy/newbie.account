import {Controller, Post, Body, Res} from '@nestjs/common';
import {ApiTags, ApiBearerAuth, ApiBody} from '@nestjs/swagger';
import {Response} from 'express';
import {AccountService} from './account.service';
import {GuardByProfile} from './security/passport/profile/profile.decorator';
import {GuardByUuid} from './security/passport/uuid/uuid.decorator';
import {AccessToken} from '@prisma/client';
import {PrismaService} from '@framework/prisma/prisma.service';

@ApiTags('Account')
@Controller('account')
export class LoginByProfileController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountService
  ) {}

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
    @Res({passthrough: true}) response: Response
  ): Promise<AccessToken> {
    // [step 1] It has been confirmed there is only one profile.
    const {firstName, middleName, lastName, suffix, dateOfBirth} = body;
    const profiles = await this.prisma.userSingleProfile.findMany({
      where: {firstName, middleName, lastName, suffix, dateOfBirth},
    });

    // [step 2] Login with userId and generate tokens.
    const {accessToken, refreshToken} = await this.accountService.login(
      profiles[0].userId
    );

    // [step 3] Send refresh token to cookie.
    const {token, cookie} = refreshToken;
    response.cookie(cookie.name, token, cookie.options);

    // [step 4] Send access token as response.
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
    @Res({passthrough: true}) response: Response
  ): Promise<AccessToken> {
    // [step 1] Login with uuid and generate tokens.
    const {accessToken, refreshToken} = await this.accountService.login(
      body.uuid
    );

    // [step 2] Send refresh token to cookie.
    const {token, cookie} = refreshToken;
    response.cookie(cookie.name, token, cookie.options);

    // [step 3] Send access token as response.
    return accessToken;
  }

  /* End */
}
