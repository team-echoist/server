import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class HistoriesResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  comment: string;

  @ApiProperty()
  @Expose()
  @IsString()
  result: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  processor: number;

  @ApiProperty()
  @Expose()
  @IsDate()
  processedDate: Date;
}
