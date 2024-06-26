import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class InquiriesResDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  @Expose()
  createdDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  @Expose()
  processed: boolean;
}
