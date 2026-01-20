import {ApiProperty} from '@nestjs/swagger';
import {Session} from '@generated/prisma/client';
import {Expose, expose} from '../../helpers/expose';
import {CommonListRequestDto, CommonListResponseDto} from '@framework/common.dto';

export class SessionsListRequestDto extends CommonListRequestDto {}

export class SessionsListResponseDto extends CommonListResponseDto {
  @ApiProperty({
    type: expose<Session>,
    isArray: true,
  })
  declare records: Expose<Session>[];
}
