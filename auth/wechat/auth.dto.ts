import {ApiProperty} from '@nestjs/swagger';
import {IsString} from 'class-validator';

export class WechatLoginDto {
  @ApiProperty({type: String, required: true})
  @IsString()
  openId: string;

  @ApiProperty({type: String, required: true})
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
