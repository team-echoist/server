import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { NoticesResDto } from '../response/noticesRes.dto';

export class NoticesSchemaDto {
  @ApiProperty({ type: NoticesResDto })
  @Expose()
  notifications: NoticesResDto;

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
