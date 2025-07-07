import {SetMetadata} from '@nestjs/common';

// Use @GuardByWechatCode() for custom.wechat strategy authentication
export const IS_LOGGING_IN_WECHAT_KEY = 'isLoggingInByWechat';
export const GuardByWechatCode = () =>
  SetMetadata(IS_LOGGING_IN_WECHAT_KEY, true);
