import validator from 'validator';

export function verifyUuid(uuid: string): boolean {
  return validator.isUUID(uuid);
}

export function verifyPassword(password: string): boolean {
  return validator.isStrongPassword(password);
}

export function verifyUsername(username: string): boolean {
  // [step 1] username length must be larger than 4 and smaller than 64.
  if (!validator.isLength(username, {min: 5, max: 63})) {
    return false;
  }

  // [step 2] username must not be email or phone to make sure email and phone can represent unique account.
  if (
    validator.isEmail(username) ||
    validator.isMobilePhone(username, ['en-US', 'zh-CN'])
  ) {
    return false;
  }

  // [step 3] For special characters, only '-' and '_'  can be contained in the username.
  return validator.isAlphanumeric(username, 'en-US', {ignore: '[-_]'});
}

export function verifyEmail(email: string): boolean {
  return validator.isEmail(email);
}

export function verifyPhone(phone: string): boolean {
  return validator.isMobilePhone(phone, ['en-US', 'zh-CN']);
}
