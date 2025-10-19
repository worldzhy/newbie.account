import {Global, Module} from '@nestjs/common';

import {AuthService} from './auth.service';
import {WechatAuthService} from './wechat/auth.service';

import {LoginByApiKeyController} from './login-by-apikey.controller';
import {LoginByApprovedSubnetController} from './login-by-approved-subnet.controller';
import {LoginByGoogleController} from './login-by-google.controller';
import {LoginByPasswordController} from './login-by-password.controller';
import {LoginByProfileController} from './login-by-profile.controller';
import {LoginByVerificationCodeController} from './login-by-verificationcode.controller';
import {LogoutController} from './logout.controller';
import {RefreshAccessTokenController} from './refresh-access-token.controller';
import {SignupEmailVerifyController} from './signup-email-verify.controller';
import {SignupController} from './signup.controller';
import {WechatLoginController} from './wechat/login.controller';
import {WechatRefreshAccessTokenController} from './wechat/refresh-access-token.controller';
import {SecurityModule} from '../security/security.module';

@Global()
@Module({
  imports: [SecurityModule],
  controllers: [
    LoginByApiKeyController,
    LoginByApprovedSubnetController,
    LoginByGoogleController,
    LoginByPasswordController,
    LoginByProfileController,
    LoginByVerificationCodeController,
    LogoutController,
    RefreshAccessTokenController,
    SignupEmailVerifyController,
    SignupController,
    WechatLoginController,
    WechatRefreshAccessTokenController,
  ],
  providers: [AuthService, WechatAuthService],
  exports: [AuthService, WechatAuthService],
})
export class AuthModule {}
