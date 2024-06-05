import { PublicEssaysDto } from '../publicEssays.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PublicEssaysSchemaDto {
  @ApiProperty({ type: [PublicEssaysDto] })
  @Expose()
  essays: PublicEssaysDto[];

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
