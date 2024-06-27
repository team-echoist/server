import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsString()
  profileImage: string;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  @IsOptional()
  activated?: boolean;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  info?: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  @IsOptional()
  createDate?: Date;
}
