import { Exclude, Expose } from 'class-transformer';
import { IsDate, IsNumber, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserResDto {
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

  @Expose()
  @IsDate()
  subscriptionEnd: Date;

  @Expose()
  @IsDate()
  createdDate: Date;

  @Expose()
  @IsDate()
  updatedDate: Date;

  @Expose()
  @IsDate()
  deletedDate: Date;
}
