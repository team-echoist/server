import { UserResDto } from './userRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EssayStatsDto } from '../../../essay/dto/essayStats.dto';

export class UserInfoResDto {
  @ApiProperty({ type: UserResDto })
  @Expose()
  user: UserResDto;

  @ApiProperty({ type: EssayStatsDto })
  @Expose()
  essayStats: EssayStatsDto;
}
