import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { GeulroquisDto } from './geulroquis.dto';

export class GeulroquisResDto {
  @ApiProperty({ type: [GeulroquisDto] })
  @Expose()
  geulroquis: GeulroquisDto[];

  @ApiProperty()
  @IsNumber()
  @Expose()
  total: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  page: number;
}
