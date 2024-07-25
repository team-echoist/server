import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class GuleroquisDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  url: string;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  provided: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  current: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  next: boolean;

  @ApiProperty()
  @IsDateString()
  @Expose()
  providedDate: Date;

  @ApiProperty()
  @IsDateString()
  @Expose()
  createdDate: Date;
}
