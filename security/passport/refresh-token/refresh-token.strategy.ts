import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-custom';
import {Request} from 'express';
import {PrismaService} from '@framework/prisma/prisma.service';
import {NO_TOKEN_PROVIDED} from '@framework/exceptions/errors.constants';
import {SessionService} from '@microservices/account/modules/session/session.service';
import {TokenService} from '@microservices/account/security/token/token.service';
import {CookieName} from '@microservices/account/security/cookie/cookie.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'custom.refresh-token'
) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService
  ) {
    super();
  }

  /**
   * 'validate' function must be implemented.
   */
  async validate(req: Request): Promise<boolean> {
    const refreshToken: string = req.cookies[CookieName.REFRESH_TOKEN];

    // [step 1] Check if refresh token is provided
    if (!refreshToken) {
      throw new UnprocessableEntityException(NO_TOKEN_PROVIDED);
    }

    // [step 2] Verify that refresh token is in db
    const count = await this.prisma.session.count({where: {refreshToken}});
    if (count === 0) {
      throw new UnauthorizedException('Token is incorrect.');
    }

    // [step 3] Validate refresh token.
    try {
      this.tokenService.verifyUserRefreshToken(refreshToken);
    } catch (error: unknown) {
      await this.sessionService.destroy(refreshToken);
      throw new UnauthorizedException('Token is expired.');
    }

    return true;
  }
}
