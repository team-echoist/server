import { Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EssayDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  title: string;

  @Expose()
  @IsString()
  content: string;

  @Expose()
  @IsNumber()
  linkedOutGauge: number;

  @Expose()
  @IsDate()
  createdDate: Date;

  @Expose()
  @IsDate()
  updatedDate: Date;

  @Expose()
  @IsString()
  thumbnail: string;

  @Expose()
  @IsBoolean()
  bookmarks: boolean;

  @Expose()
  @IsNumber()
  views: number;

  @Expose()
  @IsBoolean()
  published: boolean;

  @Expose()
  @IsBoolean()
  linkedOut: boolean;

  @Expose()
  @IsString()
  device: string;
}
