import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {async as cryptoRandomString} from 'crypto-random-string';
import {decode, DecodeOptions, sign, verify} from 'jsonwebtoken';
import {v4} from 'uuid';
import {INVALID_TOKEN} from '@framework/exceptions/errors.constants';
import {TokenSubject} from './token.constants';
import * as express from 'express';

@Injectable()
export class TokenService {
  private accessTokenExpiresIn: string | number;
  private refreshTokenExpiresIn: string | number;

  constructor(private config: ConfigService) {
    const token = this.config.getOrThrow('microservices.account.token');
    this.accessTokenExpiresIn = token.userAccess.expiresIn;
    this.refreshTokenExpiresIn = token.userRefresh.expiresIn;
  }

  /**
   * Sign a JWT
   */
  sign(
    payload: number | string | object | Buffer,
    options: {subject: string; expiresIn: string | number}
  ) {
    if (typeof payload === 'number') payload = payload.toString();
    return sign(
      payload,
      this.config.getOrThrow<string>('microservices.account.token.secret'),
      options as any
    );
  }

  /**
   * Verify and decode a JWT
   */
  verify<T>(token: string, options: {subject: string}) {
    try {
      return verify(
        token,
        this.config.get<string>('microservices.account.token.secret') ?? '',
        options
      ) as any as T;
    } catch (error) {
      throw new UnauthorizedException(INVALID_TOKEN);
    }
  }

  /**
   * Decode a JWT without verifying it
   * @deprecated Use verify() instead
   */
  decode<T>(token: string, options?: DecodeOptions) {
    return decode(token, options) as T;
  }

  /**
   * Generate a UUID
   */
  generateUuid() {
    return v4();
  }

  /**
   * Generate a cryptographically strong random string
   * @param length - Length of returned string
   * @param charactersOrType - Characters or one of the supported types
   */
  async generateRandomString(
    length = 32,
    charactersOrType = 'alphanumeric'
  ): Promise<string> {
    if (
      [
        'hex',
        'base64',
        'url-safe',
        'numeric',
        'distinguishable',
        'ascii-printable',
        'alphanumeric',
      ].includes(charactersOrType)
    )
      return cryptoRandomString({
        length,
        type: charactersOrType as
          | 'hex'
          | 'base64'
          | 'url-safe'
          | 'numeric'
          | 'distinguishable'
          | 'ascii-printable'
          | 'alphanumeric',
      });
    return cryptoRandomString({length, characters: charactersOrType});
  }

  /**
   * Sign user access token
   */
  signUserAccessToken(payload: {userId: string}) {
    return this.sign(payload, {
      subject: TokenSubject.USER_ACCESS_TOKEN,
      expiresIn: this.accessTokenExpiresIn as any,
    });
  }

  /**
   * Verify user access token
   * Returns an object with userId, iat (issued at), and exp (expiration)
   * If the token is invalid, it throws an UnauthorizedException
   */
  verifyUserAccessToken(token: string) {
    return this.verify<{userId: string; iat: number; exp: number}>(token, {
      subject: TokenSubject.USER_ACCESS_TOKEN,
    });
  }

  /**
   * Sign user refresh token
   */
  signUserRefreshToken(
    payload: {userId: string},
    options?: {expiresIn: string | number}
  ) {
    return this.sign(payload, {
      subject: TokenSubject.USER_REFRESH_TOKEN,
      expiresIn: options
        ? (options.expiresIn as any)
        : (this.refreshTokenExpiresIn as any),
    });
  }

  /**
   * Verify user refresh token
   * Returns an object with userId, iat (issued at), and exp (expiration)
   * If the token is invalid, it throws an UnauthorizedException
   */
  verifyUserRefreshToken(token: string) {
    return this.verify<{userId: string; iat: number; exp: number}>(token, {
      subject: TokenSubject.USER_REFRESH_TOKEN,
    });
  }

  /**
   * Get token from HTTP request
   * @param request - Express request object
   * @returns The token if present, otherwise undefined
   */
  getTokenFromHttpRequest(request: express.Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
