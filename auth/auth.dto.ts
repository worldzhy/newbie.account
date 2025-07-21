import {ApiProperty} from '@nestjs/swagger';
import {
  IsDate,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @ApiProperty({type: String, required: false})
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({type: String, required: true})
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({type: String, required: false})
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiProperty({type: String, required: false})
  @IsString()
  @IsOptional()
  password?: string | null;

  @ApiProperty({type: String, required: false})
  @IsString()
  @IsOptional()
  @IsIn(['ADMIN', 'USER'])
  roles?: ('ADMIN' | 'USER')[];

  @ApiProperty({type: String, required: false})
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({type: String, required: false})
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({type: String, required: false})
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({type: String, required: false})
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({type: Date, required: false})
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiProperty({type: String, required: false})
  @IsString()
  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'NONBINARY', 'UNKNOWN'])
  gender?: 'MALE' | 'FEMALE' | 'NONBINARY' | 'UNKNOWN';

  @ApiProperty({type: String, required: false})
  @IsString()
  @IsOptional()
  avatarFileId?: string;
}

export class LoginByPasswordRequestDto {
  @ApiProperty({type: String, required: true})
  @IsString()
  @IsNotEmpty()
  account: string;

  @ApiProperty({type: String, required: true})
  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginByPasswordResponseDto {
  @ApiProperty({type: String, required: true})
  token: string;

  @ApiProperty({type: Number, required: true})
  tokenExpiresInSeconds: number;
}

export class TotpLoginDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsString()
  @Length(6)
  @IsNotEmpty()
  code!: string;
}
