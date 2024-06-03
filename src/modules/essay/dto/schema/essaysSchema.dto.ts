import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EssayListResDto } from '../response/essayListRes.dto';

export class EssaysSchemaDto {
  @ApiProperty({ type: [EssayListResDto] })
  @Expose()
  essays: EssayListResDto[];

  @ApiProperty()
  @Expose()
  total: number;
}
