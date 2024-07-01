import { AlertResDto } from './alertRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';

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
