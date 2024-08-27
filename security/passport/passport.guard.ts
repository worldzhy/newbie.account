import {Injectable, ExecutionContext} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {AuthGuard} from '@nestjs/passport';
import {NoAuthGuard} from './public/public.guard';
import {JwtAuthGuard} from './jwt/jwt.guard';
import {PasswordAuthGuard} from './password/password.guard';
import {ProfileAuthGuard} from './profile/profile.guard';
import {RefreshTokenAuthGuard} from './refresh-token/refresh-token.guard';
import {UuidAuthGuard} from './uuid/uuid.guard';
import {VerificationCodeAuthGuard} from './verification-code/verification-code.guard';
import {IS_PUBLIC_KEY} from './public/public.decorator';
import {IS_LOGGING_IN_PASSWORD_KEY} from './password/password.decorator';
import {IS_LOGGING_IN_PROFILE_KEY} from './profile/profile.decorator';
import {IS_LOGGING_IN_UUID_KEY} from './uuid/uuid.decorator';
import {IS_LOGGING_IN_VERIFICATION_CODE_KEY} from './verification-code/verification-code.decorator';
import {IS_REFRESHING_ACCESS_TOKEN} from './refresh-token/refresh-token.decorator';

@Injectable()
export class PassportGuard extends AuthGuard('authentication') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Use @NoGuard() for non-authentication
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return new NoAuthGuard().canActivate(context);
    }

    // Use @GuardByPassword() for local.password strategy authentication
    const isLoggingInByPassword = this.reflector.getAllAndOverride<boolean>(
      IS_LOGGING_IN_PASSWORD_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (isLoggingInByPassword) {
      return new PasswordAuthGuard().canActivate(context);
    }

    // Use @GuardByProfile() for custom.profile strategy authentication
    const isLoggingInByProfile = this.reflector.getAllAndOverride<boolean>(
      IS_LOGGING_IN_PROFILE_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (isLoggingInByProfile) {
      return new ProfileAuthGuard().canActivate(context);
    }

    // Use @GuardByUuid() for custom.uuid strategy authentication
    const isLoggingInByUuid = this.reflector.getAllAndOverride<boolean>(
      IS_LOGGING_IN_UUID_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (isLoggingInByUuid) {
      return new UuidAuthGuard().canActivate(context);
    }

    // Use @GuardByVerificationCode() for local.verification-code strategy authentication
    const isLoggingInByVerificationCode =
      this.reflector.getAllAndOverride<boolean>(
        IS_LOGGING_IN_VERIFICATION_CODE_KEY,
        [context.getHandler(), context.getClass()]
      );
    if (isLoggingInByVerificationCode) {
      return new VerificationCodeAuthGuard().canActivate(context);
    }

    // Use @GuardByRefreshToken() for refresh endpoint authentication
    const isRefreshingAccessToken = this.reflector.getAllAndOverride<boolean>(
      IS_REFRESHING_ACCESS_TOKEN,
      [context.getHandler(), context.getClass()]
    );
    if (isRefreshingAccessToken) {
      return new RefreshTokenAuthGuard().canActivate(context);
    }

    // JWT guard is the default guard.
    return new JwtAuthGuard().canActivate(context);
  }
}
