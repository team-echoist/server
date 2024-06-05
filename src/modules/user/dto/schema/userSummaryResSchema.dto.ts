import { UserSummaryResDto } from '../response/userSummaryRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class UserSummaryResSchemaDto {
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
