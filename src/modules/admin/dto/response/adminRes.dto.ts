import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsNumber, IsString } from 'class-validator';

export class AdminResDto {
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
  name: string;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  active: boolean;

  @ApiProperty()
  @Expose()
  @IsString()
  info: string;

  @ApiProperty()
  @Expose()
  @IsString()
  imageUrl: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createDate: Date;
}