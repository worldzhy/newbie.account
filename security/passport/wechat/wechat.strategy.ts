import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-custom';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {HttpService} from '@nestjs/axios';
import {firstValueFrom} from 'rxjs';
import {PrismaService} from '@framework/prisma/prisma.service';

@Injectable()
export class WechatStrategy extends PassportStrategy(
  Strategy,
  'custom.wechat'
) {
  private appId: string;
  private appSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly prisma: PrismaService
  ) {
    super();
    this.appId = this.config.getOrThrow('microservices.account.wechat.appId');
    this.appSecret = this.config.getOrThrow(
      'microservices.account.wechat.appSecret'
    );
  }

  async validate(request: any) {
    const {code} = request.body;
    if (!code) {
      throw new UnauthorizedException('微信登录code不能为空');
    }

    try {
      // 调用微信API获取openid和session_key
      const response = await firstValueFrom(
        this.http.get('https://api.weixin.qq.com/sns/jscode2session', {
          params: {
            appid: this.appId,
            secret: this.appSecret,
            js_code: code,
            grant_type: 'authorization_code',
          },
        })
      );

      const data = response.data;
      if (data.errcode) {
        throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
      }

      const {openid, session_key, unionid} = data;

      // 查找用户是否存在
      let user = await this.prisma.user.findUnique({
        where: {wechatOpenId: openid},
      });

      // 如果用户不存在，创建新用户
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            wechatOpenId: openid,
            wechatUnionId: unionid,
            wechatSessionKey: session_key,
          },
        });
      } else {
        // 如果用户存在，更新session_key
        user = await this.prisma.user.update({
          where: {id: user.id},
          data: {
            wechatSessionKey: session_key,
            lastLoginAt: new Date(),
          },
        });
      }

      // 返回用户信息，不包含敏感信息
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {wechatSessionKey, ...userInfo} = user;
      return userInfo;
    } catch (error) {
      throw new UnauthorizedException(`微信登录异常: ${error.message}`);
    }
  }
}
