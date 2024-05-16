import { ApiProperty } from '@nestjs/swagger';
import { FullEssayResDto } from './fullEssayRes.dto';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class EssaysResDto {
  @ApiProperty({ type: [FullEssayResDto] })
  @Expose()
  essays: FullEssayResDto[];

  @ApiProperty()
  @Expose()
  @IsNumber()
  total: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  @ApiProperty()
  @Expose()
  @IsNumber()
  page: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  totalPage: number;
}
