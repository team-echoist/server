import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BadgeWithTagResDto } from '../response/badgeWithTagRes.dto';

export class BadgesWithTagsSchemaDto {
  @ApiProperty({ type: [BadgeWithTagResDto] })
  @Expose()
  badges: BadgeWithTagResDto[];
}
