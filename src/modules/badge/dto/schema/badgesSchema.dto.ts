import { BadgeResDto } from '../response/badgeRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BadgesSchemaDto {
  @ApiProperty({ type: [BadgeResDto] })
  @Expose()
  badges: BadgeResDto[];
}
