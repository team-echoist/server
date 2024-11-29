import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { EssayInfoResDto } from './essayInfoRes.dto';

export class EssaysInfoResDto {
  @ApiProperty({ type: [EssayInfoResDto] })
  @Expose()
  essays: EssayInfoResDto[];

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
