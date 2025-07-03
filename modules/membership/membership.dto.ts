import {IsEmail, IsIn, IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {MembershipRole} from '@prisma/client';
import {CommonPaginationReqDto} from '@framework/common.dto';

export class ListMembershipsDto extends CommonPaginationReqDto {}

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
