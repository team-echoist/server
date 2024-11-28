import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class CronLogResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  taskName: string;

  @ApiProperty()
  @IsDateString()
  @Expose()
  startTime: Date;

  @ApiProperty()
  @IsDateString()
  @Expose()
  endTime: Date;

  @ApiProperty()
  @IsString()
  @Expose()
  status: string;

  @ApiProperty()
  @IsString()
  @Expose()
  message: string;
}
