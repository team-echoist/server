import { ServerStatus } from '../../../../entities/server.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';

export class ServerStatusResDto {
  @ApiProperty({ description: 'open, maintenance, closed' })
  @IsEnum(ServerStatus)
  @Expose()
  status: ServerStatus;
}
