import { Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

export class ReviewResDto {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  type: string;

  @Expose()
  @IsBoolean()
  processed: boolean;

  @Expose()
  @IsDate()
  createDate: Date;

  @Expose()
  @IsDate()
  processedDate: Date;

  @Expose()
  @IsNumber()
  userId: number;

  @Expose()
  @IsNumber()
  essayId: number;

  @Expose()
  @IsString()
  essayTitle: string;
}
