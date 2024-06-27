import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';
import { InquiriesResDto } from '../response/inquiriesRes.dto';

export class InquiriesSchemaDto {
  @ApiProperty({ type: InquiriesResDto })
  @Expose()
  inquiries: InquiriesResDto;

  @ApiProperty()
  @IsNumber()
  @Expose()
  total: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  page: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  totalPage: number;
}
