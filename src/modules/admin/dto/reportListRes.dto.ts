import { ApiProperty } from '@nestjs/swagger';
import { ReportListDto } from './reportList.dto';

export class ReportListResDto {
  @ApiProperty({ type: [ReportListDto] })
  reports: ReportListDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPage: number;

  @ApiProperty()
  page: number;
}
