import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

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
  deactivationDate: Date;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isFirst: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  locationConsent: boolean;
}
