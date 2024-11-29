import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { UserSummaryResDto } from './userSummaryRes.dto';

export class UsersSummaryResDto {
  @ApiProperty({ type: [UserSummaryResDto] })
  @Expose()
  users: UserSummaryResDto[];

  @ApiProperty()
  @IsNumber()
  @Expose()
  total: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  page: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  totalPage: number;
}
