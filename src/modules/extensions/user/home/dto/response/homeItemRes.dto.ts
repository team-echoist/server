import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { ItemResDto } from './itemRes.dto';

export class HomeItemResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @Type(() => ItemResDto)
  @Expose()
  item: ItemResDto;
}
