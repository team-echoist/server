import { ApiProperty } from '@nestjs/swagger';
import { ReportsResDto } from '../response/reportsRes.dto';
import { Expose } from 'class-transformer';

export class ReportsSchemaDto {
  @ApiProperty({ type: [ReportsResDto] })
  @Expose()
  reports: ReportsResDto[];

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
