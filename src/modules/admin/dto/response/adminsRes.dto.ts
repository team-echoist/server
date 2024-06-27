import { ApiProperty } from '@nestjs/swagger';
import { AdminResDto } from './adminRes.dto';

export class AdminsResDto {
  @ApiProperty({ type: [AdminResDto] })
  admins: AdminResDto[];
}
