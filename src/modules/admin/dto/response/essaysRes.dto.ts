import { ApiProperty } from '@nestjs/swagger';
import { EssaysInfoDto } from '../essaysInfo.dto';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class EssaysResDto {
  @ApiProperty({ type: [EssaysInfoDto] })
  @Expose()
  essays: EssaysInfoDto[];

  @ApiProperty()
  @Expose()
  @IsNumber()
  total: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  @ApiProperty()
  @Expose()
  @IsNumber()
  page: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  totalPage: number;
}
