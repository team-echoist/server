import { PublicEssayResDto } from './publicEssayRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PublicEssaysResDto {
  @ApiProperty({ type: [PublicEssayResDto] })
  @Expose()
  essays: PublicEssayResDto[];

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
