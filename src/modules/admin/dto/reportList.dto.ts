import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReportListDto {
  @ApiProperty()
  @Expose()
  essayId: number;

  @ApiProperty()
  @Expose()
  essayTitle: string;

  @ApiProperty()
  @Expose()
  reportCount: number;

  @ApiProperty()
  @Expose()
  oldestReportDate: Date;
}
