import { ApiProperty } from '@nestjs/swagger';
import { AdminResDto } from './adminRes.dto';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class AdminsResDto {
  @ApiProperty({ type: [AdminResDto] })
  @Expose()
  admins: AdminResDto[];

  @ApiProperty()
  @IsNumber()
  @Expose()
  page: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  total: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  totalPage: number;
}