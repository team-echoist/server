import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { CronLogResDto } from './cronLogRes.dto';

export class CronLogsResDto {
  @ApiProperty({ type: [CronLogResDto] })
  @Expose()
  logs: CronLogResDto[];

  @ApiProperty()
  @Expose()
  total: number;

  @ApiProperty()
  @Expose()
  page: number;
}
