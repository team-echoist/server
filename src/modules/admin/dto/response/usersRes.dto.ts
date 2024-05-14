import { UserResDto } from './userRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class UsersResDto {
  @ApiProperty({ type: UserResDto })
  @Expose()
  users: UserResDto[];

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
