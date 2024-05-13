import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';
import { ReportDto } from '../report.dto';
import { ReviewDto } from '../review.dto';

export class HistoriesResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  comment: string;

  @ApiProperty()
  @Expose()
  @IsString()
  result: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  processor: number;

  @ApiProperty()
  @Expose()
  @IsDate()
  processedDate: Date;

  @ApiProperty({ type: () => ReportDto })
  @Type(() => ReportDto)
  @Expose()
  report: ReportDto;

  @ApiProperty({ type: () => ReviewDto })
  @Type(() => ReviewDto)
  @Expose()
  review: ReviewDto;
}
