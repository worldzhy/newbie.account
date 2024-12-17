import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {Request} from 'express';
import {PrismaService} from '@framework/prisma/prisma.service';
import {TokenService} from '../../token/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService
  ) {
    const secret = config.getOrThrow<string>(
      'microservices.account.token.userAccess.secret'
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true, // Pass request via the first parameter of validate
      secretOrKey: secret,
    });
  }

  /**
   * 'vaidate' function will be called after the token in the http request passes the verification.
   *
   * For the jwt-strategy, Passport first verifies the JWT's signature and decodes the JSON.
   * Then it invokes our validate() method passing the decoded JSON as its single parameter
   */
  async validate(
    req: Request,
    payload: {userId: string; sub: string; iat: number; exp: number}
  ) {
    const accessToken = this.tokenService.getTokenFromHttpRequest(req);
    if (!accessToken) {
      throw new UnauthorizedException('No access token');
    }

    const accessTokenInfo =
      this.tokenService.verifyUserAccessToken(accessToken);
    const count = await this.prisma.session.count({
      where: {accessToken},
    });

    if (count > 0) {
      return {userId: accessTokenInfo.userId};
    } else {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
