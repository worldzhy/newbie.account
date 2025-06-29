import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Prisma, User, UserGender, UserRole} from '@prisma/client';
import {Request} from 'express';
import axios from 'axios';
import {
  EMAIL_USER_CONFLICT,
  INVALID_EMAIL,
  UNVERIFIED_EMAIL,
  UNVERIFIED_LOCATION,
  USER_NOT_FOUND,
} from '@framework/exceptions/errors.constants';
import {PrismaService} from '@framework/prisma/prisma.service';
import {compareHash} from '@framework/utilities/common.util';
import {dateOfUnixTimestamp} from '@framework/utilities/datetime.util';
import {SignUpDto, SignUpWechatDto} from '@microservices/account/account.dto';
import {Expose, expose} from '@microservices/account/helpers/expose';
import {verifyEmail} from '@microservices/account/helpers/validator';
import {GeolocationService} from '@microservices/account/helpers/geolocation.service';
import {ApprovedSubnetService} from '@microservices/account/modules/approved-subnet/approved-subnet.service';
import {SessionService} from '@microservices/account/modules/session/session.service';
import {CookieService} from '@microservices/account/security/cookie/cookie.service';
import {CookieName} from '@microservices/account/security/cookie/cookie.constants';
import {TokenService} from '@microservices/account/security/token/token.service';
import {TokenSubject} from '@microservices/account/security/token/token.constants';
import {AwsSesService} from '@microservices/aws-ses/aws-ses.service';
import * as anonymize from 'ip-anonymize';
import * as randomColor from 'randomcolor';

@Injectable()
export class AccountService {
  private appFrontendUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
    private readonly approvedSubnetService: ApprovedSubnetService,
    private readonly geolocationService: GeolocationService,
    private readonly ses: AwsSesService
  ) {
    this.appFrontendUrl = this.config.getOrThrow('framework.app.frontendUrl');
  }

  async me(request: Request) {
    // [step 1] Parse token from http request header.
    const accessToken = this.tokenService.getTokenFromHttpRequest(request);

    // [step 2] Get session record.
    const session = await this.prisma.session.findFirstOrThrow({
      where: {accessToken},
    });

    // [step 3] Get user.
    return await this.prisma.user.findUniqueOrThrow({
      where: {id: session.userId},
      select: {
        id: true,
        email: true,
        phone: true,
        roles: true,
        name: true,
        firstName: true,
        middleName: true,
        lastName: true,
        memberships: true,
      },
    });
  }

  async updateMe(request: Request, body: Prisma.UserUpdateInput) {
    // [step 1] Parse token from http request header.
    const accessToken = this.tokenService.getTokenFromHttpRequest(request);

    // [step 2] Get session record.
    const session = await this.prisma.session.findFirstOrThrow({
      where: {accessToken},
    });

    // [step 3] Get user.
    return await this.prisma.user.update({
      where: {id: session.userId},
      data: body,
    });
  }

  async isSudo(request: Request) {
    // [step 1] Parse token from http request header.
    const accessToken = this.tokenService.getTokenFromHttpRequest(request);

    // [step 2] Get session record.
    const session = await this.prisma.session.findFirstOrThrow({
      where: {accessToken},
    });

    // [step 3] Get user.
    const count = await this.prisma.user.count({
      where: {
        id: session.userId,
        roles: {has: UserRole.SUDO},
      },
    });

    return count > 0 ? true : false;
  }

  async login(params: {
    ipAddress: string;
    userAgent: string;
    userId: string;
    isSkipCheck?: boolean;
  }) {
    // 某些登录方式不需要验证：微信登录
    if (!params.isSkipCheck) {
      // [step 0] Check
      await this.checkEmailOnLogin({userId: params.userId});

      await this.checkLocationOnLogin({
        userId: params.userId,
        ipAddress: params.ipAddress,
      });
    }
    // [step 1] Disable active session if existed.
    await this.prisma.session.deleteMany({where: {userId: params.userId}});

    // [step 2] Update last login time.
    await this.prisma.user.update({
      where: {id: params.userId},
      data: {lastLoginAt: new Date()},
    });

    // [step 3] Generate new tokens.
    const session = await this.sessionService.generate({
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      userId: params.userId,
    });

    const accessTokenInfo = this.tokenService.verifyUserAccessToken(
      session.accessToken
    );
    const refreshTokenInfo = this.tokenService.verifyUserRefreshToken(
      session.refreshToken
    );

    return {
      accessToken: {
        token: session.accessToken,
        tokenExpiresInSeconds: accessTokenInfo.exp - accessTokenInfo.iat,
      },
      cookie: this.cookieService.generate({
        name: CookieName.REFRESH_TOKEN,
        value: session.refreshToken,
        options: {expires: dateOfUnixTimestamp(refreshTokenInfo.exp)},
      }),
    };
  }

  async signup(params: {
    ipAddress: string;
    userData: SignUpDto;
  }): Promise<Expose<User>> {
    const {email, ...data} = params.userData;

    if (!verifyEmail(email)) {
      throw new BadRequestException(INVALID_EMAIL);
    }

    if ((await this.prisma.user.count({where: {email}})) > 0) {
      throw new ConflictException(EMAIL_USER_CONFLICT);
    }

    // Generate profile picture
    if (!data.profilePictureUrl) {
      if (data.name) {
        let initials = data.name.trim().substring(0, 2).toUpperCase();
        if (data.name.includes(' '))
          initials = data.name
            .split(' ')
            .map(word => word.trim().substring(0, 1))
            .join('')
            .toUpperCase();
        data.profilePictureUrl = `https://ui-avatars.com/api/?name=${initials}&background=${randomColor(
          {luminosity: 'light'}
        ).replace('#', '')}&color=000000`;
      }
    }

    // Generate user gender
    if (!data.gender) {
      if (data.name) {
        try {
          const prediction = await axios.get<{
            name: string;
            gender: 'male' | 'female';
            probability: number;
            count: number;
          }>(`https://api.genderize.io/?name=${data.name.split(' ')[0]}`);
          if (
            prediction.data.probability > 0.5 &&
            prediction.data.gender === 'male'
          )
            data.gender = UserGender.MALE;
          if (
            prediction.data.probability > 0.5 &&
            prediction.data.gender === 'female'
          )
            data.gender = UserGender.FEMALE;
        } catch (error) {}
      }
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {...data, email, emails: {create: {email}}},
      include: {emails: {select: {id: true}}},
    });

    // In testing, we auto-approve the email
    if (process.env.ENVIRONMENT !== 'production') {
      const emailId = user.emails[0]?.id;
      if (emailId)
        await this.prisma.email.update({
          where: {id: emailId},
          data: {isVerified: true},
        });
    } else {
      await this.ses.sendEmailWithTemplate({
        toAddress: `"${user.name}" <${email}>`,
        template: {
          'auth/verify-email': {
            userName: user.name || 'Dear',
            link: `${this.config.get<string>(
              'framework.app.frontendUrl'
            )}/auth/link/verify-email?token=${this.tokenService.sign(
              {id: user.emails[0].id},
              {subject: TokenSubject.APPROVE_EMAIL_TOKEN, expiresIn: '7d'}
            )}`,
            linkValidDays: 7,
          },
        },
      });
    }

    await this.approvedSubnetService.approveNewSubnet(
      user.id,
      params.ipAddress
    );
    return expose(user);
  }

  private async checkEmailOnLogin(params: {userId: string}) {
    const user = await this.prisma.user.findUnique({
      where: {id: params.userId},
      select: {email: true, name: true, emails: true},
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);

    if (!user.emails.find(i => i.email === user.email)?.isVerified)
      throw new UnauthorizedException(UNVERIFIED_EMAIL);
  }

  private async checkLocationOnLogin(params: {
    userId: string;
    ipAddress: string;
  }): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: {id: params.userId},
      select: {email: true, name: true, checkLocationOnLogin: true},
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    if (!user.checkLocationOnLogin) return;

    const subnet = anonymize(params.ipAddress);
    const previousSubnets = await this.prisma.approvedSubnet.findMany({
      where: {user: {id: params.userId}},
    });
    let isApproved = false;
    for await (const item of previousSubnets) {
      if (!isApproved)
        if (await compareHash(subnet, item.subnet)) isApproved = true;
    }

    if (!isApproved) {
      const location = await this.geolocationService.getLocation(
        params.ipAddress
      );
      const locationName =
        [
          location?.city?.names?.en,
          (location?.subdivisions ?? [])[0]?.names?.en,
          location?.country?.names?.en,
        ]
          .filter(i => i)
          .join(', ') || 'Unknown location';
      if (user.email) {
        this.ses.sendEmailWithTemplate({
          toAddress: user.email,
          template: {
            'auth/verify-subnet': {
              userName: user.name ?? 'friend',
              locationName,
              link: `${
                this.appFrontendUrl
              }/auth/link/approve-subnet?token=${this.tokenService.sign(
                {userId: params.userId},
                {subject: TokenSubject.APPROVE_SUBNET_TOKEN, expiresIn: '30m'}
              )}`,
              linkValidMinutes: 30,
            },
          },
        });
      }

      throw new UnauthorizedException(UNVERIFIED_LOCATION);
    }
  }

  async signUpOrLoginWechat(params: {
    ipAddress: string;
    userData: SignUpWechatDto;
  }): Promise<Expose<User>> {
    const {phone, openId} = params.userData;

    const oldUser = await this.prisma.user.findFirst({where: {phone}});
    if (oldUser) {
      return expose(oldUser);
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {phone, wechatOpenId: openId, wechatPhone: phone},
    });

    return expose(user);
  }

  async getUserByOpenId(params: {
    ipAddress: string;
    openId: string;
  }): Promise<Expose<User>> {
    const {openId} = params;

    const user = await this.prisma.user.findFirst({
      where: {wechatOpenId: openId},
    });
    if (user) {
      return expose(user);
    } else {
      throw new UnauthorizedException(USER_NOT_FOUND);
    }
  }

  /* End */
}
