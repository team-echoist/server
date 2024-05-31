import { ApiProperty } from '@nestjs/swagger';
import { EssaysInfoResDto } from '../response/essaysInfoRes.dto';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class EssaysSchemaDto {
  @ApiProperty({ type: [EssaysInfoResDto] })
  @Expose()
  essays: EssaysInfoResDto[];

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
