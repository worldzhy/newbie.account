import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-custom';
import {Request} from 'express';
import {RefreshTokenService} from '@microservices/account/security/token/refresh-token.service';
import {TokenService} from '../../token/token.service';
import {PrismaService} from '@framework/prisma/prisma.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'custom.refresh-token'
) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenService: TokenService
  ) {
    super();
  }

  /**
   * 'validate' function must be implemented.
   */
  async validate(req: Request): Promise<boolean> {
    const refreshToken = req.cookies.refreshToken;

    // [step 1] Validate refresh token.
    try {
      this.refreshTokenService.verifyToken(refreshToken);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TokenExpiredError') {
        // If expired refresh token is used, invalidate all tokens to force user to login
        const userData = this.refreshTokenService.decodeToken(refreshToken) as {
          userId: string;
        };
        await this.tokenService.invalidateAccessTokenAndRefreshToken(
          userData.userId
        );
      }
      throw new UnauthorizedException('Token is incorrect.');
    }

    // [step 2] Verify that refresh token is in db
    try {
      await this.prisma.refreshToken.findFirstOrThrow({
        where: {token: refreshToken},
      });
    } catch (err: unknown) {
      // If refresh token is valid but not in db must have logout already and bad actor might be trying to use it, invalidate all tokens to force user to login
      const userData = this.refreshTokenService.decodeToken(refreshToken) as {
        userId: string;
      };
      await this.tokenService.invalidateAccessTokenAndRefreshToken(
        userData.userId
      );
      throw new UnauthorizedException('Token is incorrect.');
    }

    return true;
  }
}
