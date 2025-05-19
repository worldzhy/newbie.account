import {Module} from '@nestjs/common';
import {APP_GUARD} from '@nestjs/core';

import {ApprovedSubnetModule} from './approved-subnet/approved-subnet.module';
import {CookieModule} from './cookie/cookie.module';
import {SessionModule} from './session/session.module';
import {TokenModule} from './token/token.module';
import {VerificationCodeModule} from './verification-code/verification-code.module';

import {RateLimiterGuard} from './rate-limiter/rate-limiter.guard';
import {PassportGuard} from './passport/passport.guard';
import {AuthorizationGuard} from './authorization/authorization.guard';
import {NoAuthGuard} from './passport/public/public.guard';
import {ApiKeyAuthGuard} from './passport/api-key/api-key.guard';
import {GoogleAuthGuard} from './passport/google-oauth/google.guard';
import {JwtAuthGuard} from './passport/jwt/jwt.guard';
import {PasswordAuthGuard} from './passport/password/password.guard';
import {ProfileAuthGuard} from './passport/profile/profile.guard';
import {RefreshTokenAuthGuard} from './passport/refresh-token/refresh-token.guard';
import {UuidAuthGuard} from './passport/uuid/uuid.guard';
import {VerificationCodeAuthGuard} from './passport/verification-code/verification-code.guard';
import {WechatAuthGuard} from './passport/wechat/wechat.guard';

import {NoStrategy} from './passport/public/public.strategy';
import {ApiKeyStrategy} from './passport/api-key/api-key.strategy';
import {GoogleStrategy} from './passport/google-oauth/google.strategy';
import {JwtStrategy} from './passport/jwt/jwt.strategy';
import {PasswordStrategy} from './passport/password/password.strategy';
import {ProfileStrategy} from './passport/profile/profile.strategy';
import {RefreshTokenStrategy} from './passport/refresh-token/refresh-token.strategy';
import {UuidStrategy} from './passport/uuid/uuid.strategy';
import {VerificationCodeStrategy} from './passport/verification-code/verification-code.strategy';
import {WechatStrategy} from './passport/wechat/wechat.strategy';

import {
  LimitAccessByIpService,
  LimitLoginByIpService,
  LimitLoginByUserService,
} from './rate-limiter/rate-limiter.service';

@Module({
  imports: [
    ApprovedSubnetModule,
    CookieModule,
    SessionModule,
    TokenModule,
    VerificationCodeModule,
  ],
  providers: [
    {provide: APP_GUARD, useClass: RateLimiterGuard}, // 2nd priority guard.
    {provide: APP_GUARD, useClass: PassportGuard}, // 3rd priority guard.
    {provide: APP_GUARD, useClass: AuthorizationGuard}, // 4th priority guard.
    NoAuthGuard,
    ApiKeyAuthGuard,
    GoogleAuthGuard,
    JwtAuthGuard,
    PasswordAuthGuard,
    ProfileAuthGuard,
    RefreshTokenAuthGuard,
    UuidAuthGuard,
    VerificationCodeAuthGuard,
    WechatAuthGuard,

    NoStrategy,
    ApiKeyStrategy,
    GoogleStrategy,
    JwtStrategy,
    PasswordStrategy,
    ProfileStrategy,
    RefreshTokenStrategy,
    UuidStrategy,
    VerificationCodeStrategy,
    WechatStrategy,

    LimitAccessByIpService,
    LimitLoginByIpService,
    LimitLoginByUserService,
  ],
  exports: [
    LimitAccessByIpService,
    LimitLoginByIpService,
    LimitLoginByUserService,
  ],
})
export class SecurityModule {}
