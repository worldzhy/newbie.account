import {IsEmail, IsIn, IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {Membership, MembershipRole} from '@prisma/client';
import {
  CommonListRequestDto,
  CommonListResponseDto,
} from '@framework/common.dto';
import {ApiProperty} from '@nestjs/swagger';

export class ListMembershipsRequestDto extends CommonListRequestDto {}

export class ListMembershipsResponseDto extends CommonListResponseDto {
  @ApiProperty({
    type: Object,
    isArray: true,
  })
  declare records: Membership[];
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

  @IsString()
  @IsIn(Object.keys(MembershipRole))
  @IsOptional()
  role?: MembershipRole;
}
