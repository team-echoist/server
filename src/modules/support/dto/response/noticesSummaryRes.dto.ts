import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { NoticeSummaryResDto } from './noticeSummaryRes.dto';

export class NoticesSummaryResDto {
  @ApiProperty({ type: NoticeSummaryResDto })
  @Expose()
  notifications: NoticeSummaryResDto;

  @ApiProperty()
  @IsNumber()
  @Expose()
  total: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  page: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  totalPage: number;
}
