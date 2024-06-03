import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { CategoryInfoDto } from '../../../story/dto/categoryInfo.dto';
import { FullUserResDto } from './fullUserRes.dto';
import { ReportDto } from '../report.dto';
import { ReviewResDto } from './reviewRes.dto';
import { EssayStatus } from '../../../../entities/essay.entity';

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
  linkedOutGauge: number;

  @ApiProperty()
  @IsLatitude()
  @Expose()
  latitude: number;

  @ApiProperty()
  @IsLongitude()
  @Expose()
  longitude: number;

  @ApiProperty()
  @IsString()
  @Expose()
  location: string;

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
  category: CategoryInfoDto;

  @ApiProperty({ type: () => [ReportDto] })
  @Type(() => ReportDto)
  @Expose()
  @IsNumber()
  reports: ReportDto[];

  @ApiProperty({ type: () => [ReviewResDto] })
  @Type(() => ReviewResDto)
  @Expose()
  @IsNumber()
  reviews: ReviewResDto[];
}
