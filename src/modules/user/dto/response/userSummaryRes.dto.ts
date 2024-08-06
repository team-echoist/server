import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEmail, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserSummaryResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsEmail()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  @IsString()
  nickname: string;

  @ApiProperty()
  @Expose()
  @IsString()
  profileImage: string;

  @ApiProperty()
  @Expose()
  @IsDate()
  createdDate: Date;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isFirst: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  locationConsent: boolean;
}
