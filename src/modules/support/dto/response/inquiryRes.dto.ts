import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsString } from 'class-validator';

export class InquiryResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  title: number;

  @ApiProperty()
  @Expose()
  @IsString()
  content: string;

  @ApiProperty()
  @Expose()
  @IsString()
  answer: string;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  processed: boolean;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createdDate: Date;
}
