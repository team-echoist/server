import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { EssayStatus } from '../../../../common/types/enum.types';

export class EssayInfoResDto {
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

  @ApiProperty({ type: 'enum' })
  @IsNotEmpty()
  @IsEnum(EssayStatus)
  @Expose()
  status: EssayStatus;

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
  storyId: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  reportCount: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  reviewCount: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  trandScore: number;
}
