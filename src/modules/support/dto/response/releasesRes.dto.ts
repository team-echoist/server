import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { ReleaseResDto } from './releaseRes.dto';

export class ReleasesResDto {
  @ApiProperty({ type: [ReleaseResDto] })
  @Type(() => ReleaseResDto)
  @Expose()
  releases: ReleaseResDto[];

  @ApiProperty()
  @Expose()
  @IsNumber()
  total: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  page: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  totalPage: number;
}
