import { PublicEssaysDto } from '../publicEssays.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PublicEssaysSchemaDto {
  @ApiProperty({ type: [PublicEssaysDto] })
  @Expose()
  essays: PublicEssaysDto[];
}
