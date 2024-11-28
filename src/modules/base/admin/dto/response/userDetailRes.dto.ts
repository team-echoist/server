import { Exclude, Expose, Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AlertSettingsResDto } from '../../../../features/contact/support/dto/response/alertSettingsRes.dto';
import { UserStatus } from '../../../../../common/types/enum.types';

export class UserDetailResDto {
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

  @ApiProperty({
    enum: UserStatus,
  })
  @IsEnum(UserStatus)
  @Expose()
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
  @IsNumber()
  reputation: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  reportCount: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  reviewCount: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  essayCount: number;

  @ApiProperty({ type: AlertSettingsResDto })
  @Type(() => AlertSettingsResDto)
  @Expose()
  alertSettings: AlertSettingsResDto;
}
