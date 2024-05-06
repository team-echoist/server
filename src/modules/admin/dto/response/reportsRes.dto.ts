import { ApiProperty } from '@nestjs/swagger';
import { ReportsDto } from '../reports.dto';
import { Expose } from 'class-transformer';

export class ReportsResDto {
  @ApiProperty({ type: [ReportsDto] })
  @Expose()
  reports: ReportsDto[];

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
