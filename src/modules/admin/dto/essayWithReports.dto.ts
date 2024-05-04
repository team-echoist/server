import { ReportDto } from './report.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { ReportListDto } from './reportList.dto';

export class EssayWithReportsDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  title: string;

  @ApiProperty()
  @IsString()
  @Expose()
  content: string;

  @ApiProperty()
  @IsNumber()
  @Expose()
  linkedOutGauge: number;

  @ApiProperty()
  @IsDate()
  @Expose()
  createdDate: Date;

  @ApiProperty()
  @IsDate()
  @Expose()
  updatedDate: Date;

  @ApiProperty()
  @IsString()
  @Expose()
  thumbnail: string;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  bookmarks: boolean;

  @ApiProperty()
  @IsNumber()
  @Expose()
  views: number;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  published: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  linkedOut: boolean;

  @ApiProperty()
  @IsString()
  @Expose()
  device: string;

  @ApiProperty()
  @IsNumber()
  @Expose()
  authorId: number;

  @ApiProperty({ type: [ReportDto] })
  @Expose()
  reports: ReportDto[];
}
