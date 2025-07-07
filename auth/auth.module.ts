import {Global, Module} from '@nestjs/common';

import {AuthService} from './auth.service';
import {WechatAuthService} from './wechat/wechat-auth.service';

import {LoginByApiKeyController} from './login-by-apikey.controller';
import {LoginByApprovedSubnetController} from './login-by-approved-subnet.controller';
import {LoginByGoogleController} from './login-by-google.controller';
import {LoginByPasswordController} from './login-by-password.controller';
import {LoginByProfileController} from './login-by-profile.controller';
import {LoginByVerificationCodeController} from './login-by-verificationcode.controller';
import {LoginRefreshController} from './login-refresh.controller';
import {LogoutController} from './logout.controller';
import {SignupEmailVerifyController} from './signup-email-verify.controller';
import {SignupController} from './signup.controller';
import {WechatLoginController} from './wechat/wechat-login.controller';
import {WechatLoginRefreshController} from './wechat/wechat-login-refresh.controller';
import {WechatSignupController} from './wechat/wechat-signup.controller';
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
    LoginRefreshController,
    LogoutController,
    SignupEmailVerifyController,
    SignupController,
    WechatLoginController,
    WechatLoginRefreshController,
    WechatSignupController,
  ],
  providers: [AuthService, WechatAuthService],
  exports: [AuthService, WechatAuthService],
})
export class AuthModule {}
