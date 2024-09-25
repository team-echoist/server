import { ItemResDto } from './itemRes.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ItemsResDto {
  @ApiProperty({ type: [ItemResDto] })
  items: ItemResDto[];
}
