import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EssayStatsDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  totalEssays: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  publishedEssays: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  linkedOutEssays: number;
}
