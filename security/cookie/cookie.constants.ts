import * as express from 'express';

export enum CookieName {
  REFRESH_TOKEN = 'refreshToken',
}

export const DefaultCookieOptions: express.CookieOptions = {
  sameSite: 'strict',
  secure: true,
  httpOnly: true,
};
