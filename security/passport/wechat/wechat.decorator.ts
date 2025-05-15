import {SetMetadata} from '@nestjs/common';

// Use @GuardByWechat() for custom.wechat strategy authentication
export const IS_LOGGING_IN_WECHAT_KEY = 'isLoggingInByWechat';
export const GuardByWechat = () => SetMetadata(IS_LOGGING_IN_WECHAT_KEY, true);
