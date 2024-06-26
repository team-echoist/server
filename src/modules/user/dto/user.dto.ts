import { Exclude, Expose } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { UserStatus } from '../../../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

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
  @IsObject()
  oauthInfo: object;

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
}
