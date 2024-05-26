import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SentenceEssaysResDto } from '../response/sentenceEssaysRes.dto';

export class SentenceEssaySchemaDto {
  @ApiProperty({ type: [SentenceEssaysResDto] })
  @Expose()
  essays: SentenceEssaysResDto[];
}
