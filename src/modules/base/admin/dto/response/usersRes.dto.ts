import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { FullUserResDto } from './fullUserRes.dto';

export class UsersResDto {
  @ApiProperty({ type: [FullUserResDto] })
  @Expose()
  users: FullUserResDto[];

  @ApiProperty()
  @Expose()
  @IsNumber()
  totalPage: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  page: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  total: number;
}
