import {Injectable} from '@nestjs/common';
import {User} from '@prisma/client';
import {PrismaService} from '@framework/prisma/prisma.service';
import {WechatSignupDto} from '@microservices/account/auth/wechat/wechat-auth.dto';
import {Expose, expose} from '@microservices/account/helpers/expose';
import {SessionService} from '@microservices/account/modules/session/session.service';
import {TokenService} from '@microservices/account/security/token/token.service';

@Injectable()
export class WechatAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService
  ) {}

  async login(params: {ipAddress: string; userAgent: string; openId: string}) {
    // [step 1] Update last login time.
    const user = await this.prisma.user.update({
      where: {wechatOpenId: params.openId},
      data: {lastLoginAt: new Date()},
    });

    // [step 2] Disable active session if existed.
    await this.prisma.session.deleteMany({where: {userId: user.id}});

    // [step 3] Generate new tokens.
    const session = await this.sessionService.generate({
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      userId: user.id,
    });

    const accessTokenInfo = this.tokenService.verifyUserAccessToken(
      session.accessToken
    );

    return {
      token: session.accessToken,
      tokenExpiresInSeconds: accessTokenInfo.exp - accessTokenInfo.iat,
      refreshToken: session.refreshToken,
      user: expose(user),
    };
  }

  async signUpOrLoginWechat(params: {
    ipAddress: string;
    userData: WechatSignupDto;
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

  /* End */
}
