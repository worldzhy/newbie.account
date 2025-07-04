import {createHash} from 'node:crypto';

export function getGravatarUrl(email: string, size = 80) {
  const trimmedEmail = email.trim().toLowerCase();
  const hash = createHash('sha256').update(trimmedEmail).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
