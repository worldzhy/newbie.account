import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';

@Injectable()
export class WechatRefreshTokenAuthGuard extends AuthGuard(
  'custom.wechat-refresh-token'
) {}
