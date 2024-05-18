import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsEmail, IsNumber, IsString } from 'class-validator';

export class FullUserResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsEmail()
  email: string;

  @ApiProperty()
  @Expose()
  @IsString()
  nickname?: string;

  @ApiProperty()
  @Exclude()
  @IsString()
  password?: string;

  @ApiProperty()
  @Expose()
  @IsString()
  gender?: string;

  @ApiProperty()
  @Expose()
  @IsString()
  profileImage?: string;

  @ApiProperty()
  @Expose()
  @IsDate()
  birthDate?: Date;

  @ApiProperty()
  @Expose()
  oauthInfo?: any;

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
  subscriptionEnd?: Date;

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
  deletedDate?: Date;
}
