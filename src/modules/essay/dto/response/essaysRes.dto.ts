import { ApiProperty } from '@nestjs/swagger';
import { EssayResDto } from './essayRes.dto';
import { Expose } from 'class-transformer';

export class EssaysResDto {
  @ApiProperty({ type: [EssayResDto] })
  @Expose()
  essays: EssayResDto[];

  @ApiProperty()
  @Expose()
  total: number;
}
