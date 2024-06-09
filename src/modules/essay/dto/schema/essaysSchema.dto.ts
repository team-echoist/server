import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EssaysResDto } from '../response/essaysRes.dto';

export class EssaysSchemaDto {
  @ApiProperty({ type: [EssaysResDto] })
  @Expose()
  essays: EssaysResDto[];

  @ApiProperty()
  @Expose()
  total: number;

  @ApiProperty()
  @Expose()
  totalPage: number;

  @ApiProperty()
  @Expose()
  page: number;
}
