import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { AlertResDto } from './alertRes.dto';

export class AlertsResDto {
  @ApiProperty({ type: [AlertResDto] })
  @Expose()
  alerts: AlertResDto[];

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
