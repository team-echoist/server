import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ItemResDto } from './itemRes.dto';

export class ItemsResDto {
  @ApiProperty()
  @Expose()
  items: ItemResDto[];
}
