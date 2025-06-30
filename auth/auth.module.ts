import {Global, Module} from '@nestjs/common';

import {LoginByApiKeyController} from './login-by-apikey.controller';
import {LoginByApprovedSubnetController} from './login-by-approved-subnet.controller';
import {LoginByGoogleController} from './login-by-google.controller';
import {LoginByPasswordController} from './login-by-password.controller';
import {LoginByProfileController} from './login-by-profile.controller';
import {LoginByVerificationCodeController} from './login-by-verificationcode.controller';
import {LoginByWechatController} from './login-by-wechat.controller';
import {LoginRefreshController} from './login-refresh.controller';
import {LogoutController} from './logout.controller';
import {SignupEmailVerifyController} from './signup-email-verify.controller';
import {SignupController} from './signup.controller';
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
    LoginByWechatController,
    LoginRefreshController,
    LogoutController,
    SignupEmailVerifyController,
    SignupController,
  ],
})
export class AuthModule {}
