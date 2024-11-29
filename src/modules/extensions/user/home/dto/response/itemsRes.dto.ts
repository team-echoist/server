import { ApiProperty } from '@nestjs/swagger';

import { ItemResDto } from './itemRes.dto';

export class ItemsResDto {
  @ApiProperty({ type: [ItemResDto] })
  items: ItemResDto[];
}
