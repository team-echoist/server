import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { SentenceEssayResDto } from './sentenceEssayRes.dto';

export class SentenceEssaysResDto {
  @ApiProperty({ type: [SentenceEssayResDto] })
  @Expose()
  essays: SentenceEssayResDto[];
}
