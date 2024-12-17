import {Injectable} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as express from 'express';
import {dateOfUnixTimestamp} from '@framework/utilities/datetime.util';

@Injectable()
export class UserRefreshTokenService {
  public cookieName = 'refreshToken';

  constructor(private readonly jwtService: JwtService) {}

  getCookieOptions(refreshToken?: string): express.CookieOptions {
    const baseOptions: express.CookieOptions = {
      sameSite: 'strict',
      secure: true,
      httpOnly: true,
    };

    if (refreshToken) {
      const data = this.jwtService.decode(refreshToken) as {
        exp: number; // Expiry is expressed in unix timestamp
      };
      return {
        expires: dateOfUnixTimestamp(data.exp),
        ...baseOptions,
      };
    } else {
      return baseOptions;
    }
  }
}
