import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CategoryInfoDto } from '../../../essay/dto/categoryInfo.dto';
import { FullUserResDto } from './fullUserRes.dto';
import { ReportDto } from '../report.dto';
import { ReviewDto } from '../review.dto';

export class FullEssayResDto {
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
  @IsOptional()
  linkedOutGauge?: number;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createdDate: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  updatedDate: Date;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  thumbnail?: string;

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

  @ApiProperty({ type: () => FullUserResDto })
  @Type(() => FullUserResDto)
  @Expose()
  @IsNumber()
  @IsNotEmpty()
  author: FullUserResDto;

  @ApiProperty({ type: () => CategoryInfoDto })
  @Type(() => CategoryInfoDto)
  @Expose()
  @IsNumber()
  @IsOptional()
  category?: CategoryInfoDto;

  @ApiProperty({ type: () => [ReportDto] })
  @Type(() => ReportDto)
  @Expose()
  @IsNumber()
  @IsOptional()
  reports: ReportDto[];

  @ApiProperty({ type: () => [ReviewDto] })
  @Type(() => ReviewDto)
  @Expose()
  @IsNumber()
  @IsOptional()
  reviews: ReviewDto[];
}
