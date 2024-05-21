import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class EssaysInfoDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  linkedOutGauge: number;

  @IsLatitude()
  @Expose()
  latitude: number;

  @IsLongitude()
  @Expose()
  longitude: number;

  @IsString()
  @Expose()
  location: string;

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
  @IsString()
  thumbnail: string;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  bookmarks: boolean;

  @ApiProperty()
  @Expose()
  @IsNumber()
  @IsNotEmpty()
  views: number;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  published: boolean;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  linkedOut: boolean;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  device: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  @IsNotEmpty()
  authorId: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  categoryId: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  reportCount: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  reviewCount: number;
}
