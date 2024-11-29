import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { EssayStatus } from '../../../../common/types/enum.types';

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

  @IsString()
  @Expose()
  location: string;
}
