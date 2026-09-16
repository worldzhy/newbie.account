import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {PermissionAction, UserRole} from '@generated/prisma/client';
import {CommonListResponseDto} from '@framework/common.dto';

/**
 * Response DTO for a single Permission record.
 */
export class PermissionResponseDto {
  @ApiProperty({type: Number})
  id: number;

  @ApiProperty({enum: PermissionAction})
  action: PermissionAction;

  @ApiProperty({type: String})
  resource: string;

  @ApiPropertyOptional({type: Object})
  where?: object | null;

  @ApiPropertyOptional({type: Boolean})
  inverted?: boolean | null;

  @ApiPropertyOptional({type: String})
  reason?: string | null;

  @ApiPropertyOptional({type: String})
  trustedUserId?: string | null;

  @ApiPropertyOptional({enum: UserRole})
  trustedUserRole?: UserRole | null;

  @ApiPropertyOptional({type: Number})
  trustedMembershipId?: number | null;

  @ApiProperty({type: Date})
  createdAt: Date;

  @ApiProperty({type: Date})
  updatedAt: Date;
}

/**
 * Paginated list response for permissions.
 */
export class PermissionListResponseDto extends CommonListResponseDto {
  @ApiProperty({type: PermissionResponseDto, isArray: true})
  declare records: PermissionResponseDto[];
}
