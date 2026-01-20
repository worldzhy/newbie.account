export enum GuardType {
  JWT = 'jwt',
  NONE = 'custom.no-auth',
  PASSWORD = 'local.password',
  API_KEY = 'custom.api-key',
  PROFILE = 'custom.user-profile',
  UUID = 'custom.uuid',
  VERIFICATION_CODE = 'local.verification-code',
  REFRESH_TOKEN = 'custom.refresh-token',
  GOOGLE = 'google',
}
