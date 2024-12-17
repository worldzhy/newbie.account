import {Injectable} from '@nestjs/common';
import {CookieName, DefaultCookieOptions} from './cookie.constants';
import {TokenService} from '../token/token.service';
import {dateOfUnixTimestamp} from '@framework/utilities/datetime.util';

@Injectable()
export class CookieService {
  constructor(private readonly tokenService: TokenService) {}

  generate(params: {
    name: CookieName;
    value: string;
    options: {expires: Date};
  }) {
    return {
      name: params.name,
      value: params.value,
      options: {
        ...DefaultCookieOptions,
        expires: params.options.expires,
      },
    };
  }

  generateForRefreshToken(refreshToken: string) {
    const refreshTokenInfo =
      this.tokenService.verifyUserRefreshToken(refreshToken);

    return {
      name: CookieName.REFRESH_TOKEN,
      value: refreshToken,
      options: {
        ...DefaultCookieOptions,
        expires: dateOfUnixTimestamp(refreshTokenInfo.exp),
      },
    };
  }
}
