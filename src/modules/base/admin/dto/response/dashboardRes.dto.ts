import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';

export class DashboardResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  totalUser: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  currentSubscriber: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  todaySubscribers: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  totalEssays: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  todayEssays: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  publishedEssays: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  linkedOutEssays: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  unprocessedReports: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  unprocessedReviews: number;
}
