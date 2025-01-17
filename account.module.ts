import {Global, Module} from '@nestjs/common';

import {SecurityModule} from './security/security.module';

import {AuditLogController} from './audit-logs/audit-log.controller';
import {LoginByPasswordController} from './login-by-password.controller';
import {LoginByProfileController} from './login-by-profile.controller';
import {LoginByVerificationCodeController} from './login-by-verificationcode.controller';
import {LoginByApproveSubnetController} from './login-by-approve-subnet.controller';
import {LoginRefreshController} from './login-refresh.controller';
import {LogoutController} from './logout.controller';
import {MeController} from './me.controller';
import {MembershipController} from './membership/membership.controller';
import {PasswordController} from './password.controller';
import {SignupController} from './signup.controller';
import {SignupEmailVerifyController} from './signup-email-verify.controller';
import {ApiKeyController} from './api-key/api-key.controller';

import {OrganizationController} from '../../microservices/account/organization/organization.controller';
import {PermissionController} from '../../microservices/account/permission/permission.controller';
import {UserController} from '../../microservices/account/user/user.controller';

import {AccountService} from './account.service';
import {ApiKeyService} from './api-key/api-key.service';
import {GeolocationService} from './geolocation/geolocation.service';
import {MembershipService} from './membership/membership.service';
import {UserService} from './user/user.service';

@Global()
@Module({
  imports: [SecurityModule],
  controllers: [
    AuditLogController,
    LoginByPasswordController,
    LoginByProfileController,
    LoginByVerificationCodeController,
    LoginByApproveSubnetController,
    LoginRefreshController,
    LogoutController,
    MeController,
    MembershipController,
    PasswordController,
    SignupController,
    SignupEmailVerifyController,
    ApiKeyController,

    OrganizationController,
    PermissionController,
    UserController,
  ],
  providers: [
    AccountService,
    ApiKeyService,
    GeolocationService,
    MembershipService,
    UserService,
  ],
  exports: [
    AccountService,
    ApiKeyService,
    GeolocationService,
    MembershipService,
    UserService,
  ],
})
export class AccountModule {}
