import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../../../entities/user.entity';

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
  @IsObject()
  oauthInfo: object;

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
  reportCount: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  reviewCount: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  essayCount: number;
}
