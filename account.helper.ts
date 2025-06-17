import {Session, User} from '@prisma/client';
import {createHash} from 'node:crypto';

/** Delete sensitive keys from an object */
export function expose<T>(item: T): Expose<T> {
  if (!item) return {} as T;

  if ((item as any as Partial<User>).password) (item as any).hasPassword = true;
  delete (item as any as Partial<User>).password;
  delete (item as any as Partial<Session>).refreshToken;

  return item;
}

export type Expose<T> = Omit<
  Omit<
    Omit<Omit<Omit<T, 'password'>, 'twoFactorSecret'>, 'token'>,
    'emailSafe'
  >,
  'subnet'
>;

export function getGravatarUrl(email: string, size = 80) {
  const trimmedEmail = email.trim().toLowerCase();
  const hash = createHash('sha256').update(trimmedEmail).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
