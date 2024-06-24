import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { AdminResDto } from './adminRes.dto';

export class NoticeWithProcessorResDto {
  @ApiProperty()
  @IsString()
  @Expose()
  title: string;

  @ApiProperty()
  @IsString()
  @Expose()
  content: string;

  @ApiProperty()
  @IsDateString()
  @Expose()
  createdDate: Date;

  @ApiProperty({ type: AdminResDto })
  @Type(() => AdminResDto)
  @Expose()
  processor: AdminResDto;
}
