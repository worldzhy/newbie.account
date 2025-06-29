import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {PrismaService} from '@framework/prisma/prisma.service';
import {GeolocationService} from '@microservices/account/helpers/geolocation.service';
import {UAParser} from 'ua-parser-js';
import {
  NO_TOKEN_PROVIDED,
  SESSION_NOT_FOUND,
} from '@framework/exceptions/errors.constants';
import {secondsUntilUnixTimestamp} from '@framework/utilities/datetime.util';
import {TokenService} from '../../security/token/token.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geolocationService: GeolocationService,
    private readonly tokenService: TokenService
  ) {}

  async generate(params: {
    ipAddress: string;
    userAgent: string;
    userId: string;
  }) {
    const ua = new UAParser(params.userAgent);
    const location = await this.geolocationService.getLocation(
      params.ipAddress
    );
    return await this.prisma.session.create({
      data: {
        accessToken: this.tokenService.signUserAccessToken({
          userId: params.userId,
        }),
        refreshToken: this.tokenService.signUserRefreshToken({
          userId: params.userId,
        }),
        ipAddress: params.ipAddress,
        city: location?.city?.names?.en,
        region: location?.subdivisions?.pop()?.names?.en,
        timezone: location?.location?.time_zone,
        countryCode: location?.country?.iso_code,
        userAgent: params.userAgent,
        browser:
          `${ua.getBrowser().name ?? ''} ${
            ua.getBrowser().version ?? ''
          }`.trim() || undefined,
        operatingSystem:
          `${ua.getOS().name ?? ''} ${ua.getOS().version ?? ''}`
            .replace('Mac OS', 'macOS')
            .trim() || undefined,
        userId: params.userId,
      },
    });
  }

  async refresh(refreshToken: string) {
    // [step 1] Validate refresh token
    const refreshTokenInfo =
      this.tokenService.verifyUserRefreshToken(refreshToken);

    // [step 2] Update tokens.
    return await this.prisma.session.update({
      where: {refreshToken},
      data: {
        accessToken: this.tokenService.signUserAccessToken({
          userId: refreshTokenInfo.userId,
        }),
        refreshToken: this.tokenService.signUserRefreshToken(
          {userId: refreshTokenInfo.userId},
          {expiresIn: secondsUntilUnixTimestamp(refreshTokenInfo.exp)}
        ),
      },
    });
  }

  async destroy(refreshToken: string) {
    if (!refreshToken)
      throw new UnprocessableEntityException(NO_TOKEN_PROVIDED);

    const session = await this.prisma.session.findFirst({
      where: {refreshToken},
      select: {id: true, user: {select: {id: true}}},
    });
    if (!session) throw new NotFoundException(SESSION_NOT_FOUND);

    await this.prisma.session.delete({
      where: {id: session.id},
    });
  }
}
