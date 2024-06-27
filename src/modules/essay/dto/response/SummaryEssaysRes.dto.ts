import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SummaryEssayResDto } from './summaryEssayRes.dto';

export class SummaryEssaysResDto {
  @ApiProperty({ type: [SummaryEssayResDto] })
  @Expose()
  essays: SummaryEssayResDto[];

  @ApiProperty()
  @Expose()
  total: number;

  @ApiProperty()
  @Expose()
  totalPage: number;

  @ApiProperty()
  @Expose()
  page: number;
}
