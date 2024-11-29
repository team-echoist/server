import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { BadgeResDto } from './badgeRes.dto';

export class BadgesResDto {
  @ApiProperty({ type: [BadgeResDto] })
  @Expose()
  badges: BadgeResDto[];
}
