import { BadgeResDto } from './badgeRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BadgesResDto {
  @ApiProperty({ type: [BadgeResDto] })
  @Expose()
  badges: BadgeResDto[];
}
