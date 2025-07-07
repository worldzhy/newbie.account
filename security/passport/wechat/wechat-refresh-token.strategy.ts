import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-custom';
import {Request} from 'express';
import {PrismaService} from '@framework/prisma/prisma.service';
import {SessionService} from '@microservices/account/modules/session/session.service';
import {TokenService} from '@microservices/account/security/token/token.service';

@Injectable()
export class WechatRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'custom.wechat-refresh-token'
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
    const refreshToken = req.body.refreshToken;

    // [step 1] Verify that refresh token is in db
    try {
      await this.prisma.session.findFirstOrThrow({where: {refreshToken}});
    } catch (error) {
      throw new UnauthorizedException('Token is incorrect.');
    }

    // [step 2] Validate refresh token.
    try {
      this.tokenService.verifyUserRefreshToken(refreshToken);
    } catch (error: unknown) {
      await this.sessionService.destroy(refreshToken);
      throw new UnauthorizedException('Token is expired.');
    }

    return true;
  }
}
