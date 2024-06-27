import { ApiProperty } from '@nestjs/swagger';
import { ReportResDto } from './reportRes.dto';
import { Expose } from 'class-transformer';

export class ReportsResDto {
  @ApiProperty({ type: [ReportResDto] })
  @Expose()
  reports: ReportResDto[];

  @ApiProperty()
  @Expose()
  totalReports: number;

  @ApiProperty()
  @Expose()
  totalEssay: number;

  @ApiProperty()
  @Expose()
  totalPage: number;

  @ApiProperty()
  @Expose()
  page: number;
}
