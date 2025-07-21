import {ApiProperty} from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class ResendEmailVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  origin?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  origin?: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @IsBoolean()
  @IsOptional()
  ignorePwnedPassword?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The user ID of the account to change the password for.',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'The current password of the account.',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'The new password for the account.',
  })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsOptional()
  origin?: string;
}
