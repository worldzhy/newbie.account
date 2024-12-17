import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {User, UserGender, UserRole} from '@prisma/client';
import {Request} from 'express';
import axios from 'axios';
import {verifyEmail} from './account.validator';
import {SignUpDto} from './account.dto';
import {Expose, expose} from './account.helper';
import {GeolocationService} from './geolocation/geolocation.service';
import {ApprovedSubnetService} from './security/approved-subnet/approved-subnet.service';
import {SessionService} from './security/session/session.service';
import {TokenService} from './security/token/token.service';
import {TokenSubject} from './security/token/token.constants';
import {CookieService} from './security/cookie/cookie.service';
import {CookieName} from './security/cookie/cookie.constants';
import * as anonymize from 'ip-anonymize';
import * as randomColor from 'randomcolor';
import {EmailService} from '@microservices/notification/email/email.service';
import {PrismaService} from '@framework/prisma/prisma.service';
import {compareHash} from '@framework/utilities/common.util';
import {dateOfUnixTimestamp} from '@framework/utilities/datetime.util';
import {
  EMAIL_USER_CONFLICT,
  INVALID_EMAIL,
  UNVERIFIED_EMAIL,
  UNVERIFIED_LOCATION,
  USER_NOT_FOUND,
} from '@framework/exceptions/errors.constants';

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
    private readonly email: EmailService
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
        memberships: true,
      },
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

  async login(params: {ipAddress: string; userAgent: string; userId: string}) {
    // [step 0] Check
    await this.checkEmailOnLogin({userId: params.userId, email: ''});

    await this.checkLocationOnLogin({
      userId: params.userId,
      ipAddress: params.ipAddress,
    });

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
      data: {...data, emails: {create: {email}}},
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
      await this.email.sendWithTemplate({
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

  private async checkEmailOnLogin(params: {userId: string; email: string}) {
    const user = await this.prisma.user.findUnique({
      where: {id: params.userId},
      select: {email: true, name: true, emails: true},
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);

    if (!user.emails.find(i => i.email === params.email)?.isVerified)
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
        this.email.sendWithTemplate({
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

  /* End */
}
