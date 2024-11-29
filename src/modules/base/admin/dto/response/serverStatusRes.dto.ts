import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';

import { ServerStatus } from '../../../../../common/types/enum.types';

export class ServerStatusResDto {
  @ApiProperty({ description: 'open, maintenance, closed' })
  @IsEnum(ServerStatus)
  @Expose()
  status: ServerStatus;
}
