import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class EssayStatsDto {
  @Expose()
  @IsNumber()
  totalEssays: number;

  @Expose()
  @IsNumber()
  publishedEssays: number;

  @Expose()
  @IsNumber()
  linkedOutEssays: number;
}
