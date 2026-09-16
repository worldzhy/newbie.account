import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {MfaMethod, UserGender, UserRole, UserStatus} from '@generated/prisma/client';
import {CommonListResponseDto} from '@framework/common.dto';

/**
 * Response DTO for User (password stripped by service.withoutPassword).
 * Sensitive fields (twoFactorSecret, wechatSessionKey) are intentionally omitted
 * from the response schema.
 */
export class UserResponseDto {
  @ApiProperty({type: String})
  id: string;

  @ApiProperty({type: Boolean})
  checkLocationOnLogin: boolean;

  @ApiProperty({enum: UserStatus})
  status: UserStatus;

  @ApiPropertyOptional({type: String})
  username?: string | null;

  @ApiPropertyOptional({type: String})
  email?: string | null;

  @ApiPropertyOptional({type: String})
  phone?: string | null;

  @ApiProperty({enum: UserRole, isArray: true})
  roles: UserRole[];

  @ApiPropertyOptional({type: String})
  name?: string | null;

  @ApiPropertyOptional({type: String})
  firstName?: string | null;

  @ApiPropertyOptional({type: String})
  middleName?: string | null;

  @ApiPropertyOptional({type: String})
  lastName?: string | null;

  @ApiPropertyOptional({type: Date})
  dateOfBirth?: Date | null;

  @ApiPropertyOptional({enum: UserGender})
  gender?: UserGender | null;

  @ApiPropertyOptional({type: String})
  avatarFileId?: string | null;

  @ApiPropertyOptional({type: String})
  uiAvatarsUrl?: string | null;

  @ApiProperty({type: String})
  timezone: string;

  @ApiProperty({enum: MfaMethod})
  twoFactorMethod: MfaMethod;

  @ApiPropertyOptional({type: String})
  twoFactorPhone?: string | null;

  @ApiPropertyOptional({type: Date})
  lastLoginAt?: Date | null;

  @ApiProperty({type: Date})
  createdAt: Date;

  @ApiProperty({type: Date})
  updatedAt: Date;

  @ApiPropertyOptional({type: String})
  wechatOpenId?: string | null;

  @ApiPropertyOptional({type: String})
  wechatUnionId?: string | null;
}

/**
 * Response DTO for user creation (only selected fields returned).
 */
export class CreateUserResponseDto {
  @ApiProperty({type: String})
  id: string;

  @ApiPropertyOptional({type: String})
  email?: string | null;

  @ApiPropertyOptional({type: String})
  phone?: string | null;

  @ApiProperty({enum: UserStatus})
  status: UserStatus;

  @ApiPropertyOptional({type: String})
  name?: string | null;

  @ApiPropertyOptional({type: String})
  firstName?: string | null;

  @ApiPropertyOptional({type: String})
  middleName?: string | null;

  @ApiPropertyOptional({type: String})
  lastName?: string | null;
}

/**
 * Response DTO for password change (only identity fields returned).
 */
export class UserChangePasswordResponseDto {
  @ApiProperty({type: String})
  id: string;

  @ApiPropertyOptional({type: String})
  email?: string | null;

  @ApiPropertyOptional({type: String})
  phone?: string | null;
}

/**
 * Paginated list response for users.
 */
export class UserListResponseDto extends CommonListResponseDto {
  @ApiProperty({type: UserResponseDto, isArray: true})
  declare records: UserResponseDto[];
}
