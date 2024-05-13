import { Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsObject, IsString } from 'class-validator';

export class UserDto {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  nickname: string;

  @Expose()
  @IsString()
  email: string;

  @Expose()
  @IsString()
  password: string;

  @Expose()
  @IsString()
  gender: string;

  @Expose()
  @IsString()
  profileImage: string;

  @Expose()
  @IsDate()
  birthDate: Date;

  @Expose()
  @IsObject()
  oauthInfo: object;

  @Expose()
  @IsString()
  role: string;

  @Expose()
  @IsBoolean()
  banned: boolean;

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