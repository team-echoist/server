import { ApiProperty } from '@nestjs/swagger';
import { EssayResDto } from '../response/essayRes.dto';
import { Expose } from 'class-transformer';

export class EssaysSchemaDto {
  @ApiProperty({ type: [EssayResDto] })
  @Expose()
  essays: EssayResDto[];

  @ApiProperty()
  @Expose()
  total: number;
}
