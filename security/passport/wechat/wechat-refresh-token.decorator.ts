import {SetMetadata} from '@nestjs/common';

// Use @GuardByWechatRefreshToken() for refresh endpoint authentication
export const IS_REFRESHING_WECHAT_ACCESS_TOKEN_KEY =
  'isRefreshingWechatAccessToken';
export const GuardByWechatRefreshToken = () =>
  SetMetadata(IS_REFRESHING_WECHAT_ACCESS_TOKEN_KEY, true);
