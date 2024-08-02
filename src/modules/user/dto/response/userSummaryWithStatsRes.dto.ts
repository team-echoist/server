import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EssayStatsDto } from '../../../essay/dto/essayStats.dto';
import { UserSummaryResDto } from './userSummaryRes.dto';

export class UserSummaryWithStatsResDto {
  @ApiProperty({ type: UserSummaryResDto })
  @Expose()
  user: UserSummaryResDto;

  @ApiProperty({ type: EssayStatsDto })
  @Expose()
  essayStats: EssayStatsDto;
}
