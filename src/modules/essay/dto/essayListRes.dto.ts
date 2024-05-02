import { ApiProperty } from '@nestjs/swagger';
import { EssayResDto } from './essayRes.dto';

export class EssayListResDto {
  @ApiProperty({ type: [EssayResDto] })
  essays: EssayResDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPage: number;

  @ApiProperty()
  page: number;
}
