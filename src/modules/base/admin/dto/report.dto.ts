import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReportDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  reason: string;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  processed: boolean;

  @ApiProperty()
  @Expose()
  @IsDate()
  processedDate: Date | null;

  @ApiProperty()
  @Expose()
  @IsDate()
  createdDate: Date;

  @ApiProperty()
  @Expose()
  @IsNumber()
  reporterId: number;
}
