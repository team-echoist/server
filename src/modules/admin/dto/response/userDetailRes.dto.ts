import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty()
  @Expose()
  @IsBoolean()
  monitored: boolean;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  banned: boolean;

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
