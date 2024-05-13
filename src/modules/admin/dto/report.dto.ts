import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class ReportDto {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  reason: string;

  @Expose()
  @IsBoolean()
  processed: boolean;

  @Expose()
  @IsDate()
  processedDate: Date | null;

  @Expose()
  @IsDate()
  createdDate: Date;

  @Expose()
  @IsNumber()
  reporterId: number;
}
