import {Injectable} from '@nestjs/common';
import {CookieName, DefaultCookieOptions} from './cookie.constants';

@Injectable()
export class CookieService {
  constructor() {}

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
}
