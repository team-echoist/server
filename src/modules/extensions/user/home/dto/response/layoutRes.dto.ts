import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber } from 'class-validator';

import { HomeItemResDto } from './homeItemRes.dto';

export class LayoutResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @IsDate()
  @Expose()
  updatedDate: Date;

  @ApiProperty({ type: [HomeItemResDto] })
  @Type(() => HomeItemResDto)
  @Expose()
  homeItems: HomeItemResDto[];
}
