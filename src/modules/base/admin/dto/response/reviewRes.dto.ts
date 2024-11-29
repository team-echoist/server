import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

export class ReviewResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  type: string;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  processed: boolean;

  @ApiProperty()
  @Expose()
  @IsDate()
  createDate: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  processedDate: Date;

  @ApiProperty()
  @Expose()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  essayId: number;

  @ApiProperty()
  @Expose()
  @IsString()
  essayTitle: string;
}
