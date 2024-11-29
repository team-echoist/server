import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

import { FullUserResDto } from './fullUserRes.dto';

export class FullInquiryResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  type: string;

  @ApiProperty()
  @IsString()
  @Expose()
  title: string;

  @ApiProperty()
  @IsString()
  @Expose()
  content: string;

  @ApiProperty()
  @IsString()
  @Expose()
  answer: string;

  @ApiProperty({ type: FullUserResDto })
  @Type(() => FullUserResDto)
  @Expose()
  user: FullUserResDto;
}
