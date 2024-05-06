import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserResDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nickname: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @Exclude()
  password: string;

  @Exclude()
  banned: boolean;

  @Exclude()
  role: string;

  @Exclude()
  birthDate: Date;

  @Exclude()
  gender: string;

  @Exclude()
  oauthInfo: object;
}
