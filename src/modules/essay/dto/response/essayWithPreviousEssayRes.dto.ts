import { EssayResDto } from './essayRes.dto';
import { SummaryEssayResDto } from './summaryEssayRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EssayWithPreviousEssayResDto {
  @ApiProperty({ type: EssayResDto })
  @Expose()
  essay: EssayResDto;

  @ApiProperty({ type: SummaryEssayResDto })
  @Expose()
  previousEssays: SummaryEssayResDto[];
}
