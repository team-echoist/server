import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsString } from 'class-validator';

export class GeulroquisDto {
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
