import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EssayStatus } from '../../../entities/essay.entity';

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
  @IsEnum(EssayStatus)
  @IsOptional()
  status?: EssayStatus;

  @IsLatitude()
  @Expose()
  latitude: number;

  @IsLongitude()
  @Expose()
  longitude: number;

  @IsString()
  @Expose()
  location: string;

  @Expose()
  @IsString()
  device: string;
}
