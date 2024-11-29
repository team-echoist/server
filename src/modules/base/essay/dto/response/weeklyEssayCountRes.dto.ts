import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsNumber } from 'class-validator';

export class WeeklyEssayCountResDto {
  @ApiProperty()
  @Expose()
  @IsDateString()
  weekStart: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  weekEnd: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  count: number;
}
