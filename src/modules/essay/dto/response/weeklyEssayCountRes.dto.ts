import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';

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
