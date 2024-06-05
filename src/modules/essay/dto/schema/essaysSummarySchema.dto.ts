import { EssaySummaryResDto } from '../response/essaySummaryRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class EssaysSummarySchemaDto {
  @ApiProperty({ type: [EssaySummaryResDto] })
  @Expose()
  essays: EssaySummaryResDto[];

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
