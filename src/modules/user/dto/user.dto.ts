import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../../common/types/enum.types';

export class UserDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  nickname: string;

  @ApiProperty()
  @Expose()
  @IsString()
  email: string;

  @ApiProperty()
  @Exclude()
  @IsString()
  password: string;

  @ApiProperty()
  @Expose()
  @IsString()
  gender: string;

  @ApiProperty()
  @Expose()
  @IsString()
  profileImage: string;

  @ApiProperty()
  @Expose()
  @IsDate()
  birthDate: Date;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  platform: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  platformId: string;

  @ApiProperty()
  @Expose()
  @IsString()
  role: string;

  @ApiProperty()
  @Expose()
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty()
  @Expose()
  @IsDate()
  subscriptionEnd: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  createdDate: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  updatedDate: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  deletedDate: Date;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isFirst: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  locationConsent: boolean;
}
