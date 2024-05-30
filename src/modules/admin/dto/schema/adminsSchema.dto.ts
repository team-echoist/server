import { AdminsResDto } from '../response/adminsRes.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AdminsSchemaDto {
  @ApiProperty({ type: [AdminsResDto] })
  admins: AdminsResDto[];
}
