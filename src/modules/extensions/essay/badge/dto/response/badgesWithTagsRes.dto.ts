import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { BadgeWithTagResDto } from './badgeWithTagRes.dto';

export class BadgesWithTagsResDto {
  @ApiProperty({ type: [BadgeWithTagResDto] })
  @Expose()
  badges: BadgeWithTagResDto[];
}
