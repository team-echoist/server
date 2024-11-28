import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SavedAdminResDto {
  @ApiProperty()
  @Expose()
  @IsString()
  email: string;
}
