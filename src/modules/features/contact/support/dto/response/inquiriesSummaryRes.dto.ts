import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';
import { InquirySummaryResDto } from './inquirySummaryRes.dto';

export class InquiriesSummaryResDto {
  @ApiProperty({ type: InquirySummaryResDto })
  @Expose()
  inquiries: InquirySummaryResDto;

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
