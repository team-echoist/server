import { ApiProperty } from '@nestjs/swagger';
import { GuleroquisDto } from './guleroquis.dto';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GuleroquisResDto {
  @ApiProperty({ type: [GuleroquisDto] })
  @Expose()
  guleroquis: GuleroquisDto[];

  @ApiProperty()
  @IsNumber()
  @Expose()
  total: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  page: number;
}
