import { EssayResDto } from '../response/essayRes.dto';
import { EssaysResDto } from '../response/essaysRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EssaySchemaDto {
  @ApiProperty({ type: EssayResDto })
  @Expose()
  essay: EssayResDto;

  @ApiProperty({ type: EssaysResDto })
  @Expose()
  previousEssays: EssaysResDto[];
}
