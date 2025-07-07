import {IsString} from 'class-validator';

export class WechatSignupDto {
  @IsString()
  openId: string;

  @IsString()
  phone: string;
}

export class WechatCodeLoginDto {
  /**
   * 微信登录临时凭证
   */
  @IsString()
  code: string;
}
export class WechatOpenIdLoginDto {
  @IsString()
  openId: string;
}
