import {IsEmail, IsIn, IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {Membership, MembershipRole} from '@prisma/client';
import {Expose, expose} from '../account.helper';
import {
  CommonPaginationReqDto,
  CommonPaginationResDto,
} from '@framework/common.dto';

export class MembershipsListReqDto extends CommonPaginationReqDto {}

export class MembershipsListResDto {
  @ApiProperty({
    type: expose<Membership>,
    isArray: true,
  })
  records: Expose<Membership>[];

  @ApiProperty({
    type: CommonPaginationResDto,
  })
  pagination: CommonPaginationResDto;
}

export class UpdateMembershipDto {
  @IsString()
  @IsIn(['OWNER', 'ADMIN', 'MEMBER'])
  @IsOptional()
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export class CreateMembershipDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    type: MembershipRole,
  })
  @IsOptional()
  role?: MembershipRole;
}
