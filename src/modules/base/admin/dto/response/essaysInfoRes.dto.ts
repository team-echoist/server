import { ApiProperty } from '@nestjs/swagger';
import { EssayInfoResDto } from './essayInfoRes.dto';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

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
