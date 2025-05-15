import {Injectable, ExecutionContext} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {AuthGuard} from '@nestjs/passport';
import {NoAuthGuard} from './public/public.guard';
import {ApiKeyAuthGuard} from './api-key/api-key.guard';
import {JwtAuthGuard} from './jwt/jwt.guard';
import {PasswordAuthGuard} from './password/password.guard';
import {ProfileAuthGuard} from './profile/profile.guard';
import {RefreshTokenAuthGuard} from './refresh-token/refresh-token.guard';
import {UuidAuthGuard} from './uuid/uuid.guard';
import {VerificationCodeAuthGuard} from './verification-code/verification-code.guard';
import {WechatAuthGuard} from './wechat/wechat.guard';
import {IS_PUBLIC_KEY} from './public/public.decorator';
import {IS_LOGGING_IN_PASSWORD_KEY} from './password/password.decorator';
import {IS_LOGGING_IN_PROFILE_KEY} from './profile/profile.decorator';
import {IS_LOGGING_IN_UUID_KEY} from './uuid/uuid.decorator';
import {IS_LOGGING_IN_VERIFICATION_CODE_KEY} from './verification-code/verification-code.decorator';
import {IS_REFRESHING_ACCESS_TOKEN} from './refresh-token/refresh-token.decorator';
import {IS_LOGGING_IN_APIKEY_KEY} from './api-key/api-key.decorator';
import {IS_LOGGING_IN_WECHAT_KEY} from './wechat/wechat.decorator';

@Injectable()
export class PassportGuard extends AuthGuard('authentication') {
  constructor(
    private reflector: Reflector,
    private noAuthGuard: NoAuthGuard,
    private passwordAuthGuard: PasswordAuthGuard,
    private apiKeyAuthGuard: ApiKeyAuthGuard,
    private profileAuthGuard: ProfileAuthGuard,
    private uuidAuthGuard: UuidAuthGuard,
    private verificationCodeAuthGuard: VerificationCodeAuthGuard,
    private refreshTokenAuthGuard: RefreshTokenAuthGuard,
    private wechatAuthGuard: WechatAuthGuard,
    private jwtAuthGuard: JwtAuthGuard
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Use @NoGuard() for non-authentication
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return this.noAuthGuard.canActivate(context);
    }

    // Use @GuardByPassword() for local.password strategy authentication
    const isLoggingInByPassword = this.reflector.getAllAndOverride<boolean>(
      IS_LOGGING_IN_PASSWORD_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (isLoggingInByPassword) {
      return this.passwordAuthGuard.canActivate(context);
    }

    // Use @GuardByApiKey() for custom.api-key endpoint authentication
    const isLoggingInByApiKey = this.reflector.getAllAndOverride<boolean>(
      IS_LOGGING_IN_APIKEY_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (isLoggingInByApiKey) {
      return this.apiKeyAuthGuard.canActivate(context);
    }

    // Use @GuardByProfile() for custom.profile strategy authentication
    const isLoggingInByProfile = this.reflector.getAllAndOverride<boolean>(
      IS_LOGGING_IN_PROFILE_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (isLoggingInByProfile) {
      return this.profileAuthGuard.canActivate(context);
    }

    // Use @GuardByUuid() for custom.uuid strategy authentication
    const isLoggingInByUuid = this.reflector.getAllAndOverride<boolean>(
      IS_LOGGING_IN_UUID_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (isLoggingInByUuid) {
      return this.uuidAuthGuard.canActivate(context);
    }

    // Use @GuardByVerificationCode() for local.verification-code strategy authentication
    const isLoggingInByVerificationCode =
      this.reflector.getAllAndOverride<boolean>(
        IS_LOGGING_IN_VERIFICATION_CODE_KEY,
        [context.getHandler(), context.getClass()]
      );
    if (isLoggingInByVerificationCode) {
      return this.verificationCodeAuthGuard.canActivate(context);
    }

    // Use @GuardByRefreshToken() for refresh endpoint authentication
    const isRefreshingAccessToken = this.reflector.getAllAndOverride<boolean>(
      IS_REFRESHING_ACCESS_TOKEN,
      [context.getHandler(), context.getClass()]
    );
    if (isRefreshingAccessToken) {
      return this.refreshTokenAuthGuard.canActivate(context);
    }

    // Use @GuardByWechat() for custom.wechat strategy authentication
    const isLoggingInByWechat = this.reflector.getAllAndOverride<boolean>(
      IS_LOGGING_IN_WECHAT_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (isLoggingInByWechat) {
      return this.wechatAuthGuard.canActivate(context);
    }

    // JWT guard is the default guard.
    return this.jwtAuthGuard.canActivate(context);
  }
}
