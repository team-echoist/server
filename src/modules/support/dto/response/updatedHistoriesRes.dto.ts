import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { UpdatedHistoryResDto } from './updatedHistoryRes.dto';

export class UpdatedHistoriesResDto {
  @ApiProperty({ type: [UpdatedHistoryResDto] })
  @Type(() => UpdatedHistoryResDto)
  @Expose()
  histories: UpdatedHistoryResDto[];

  @ApiProperty()
  @Expose()
  @IsNumber()
  total: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  page: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  totalPage: number;
}
