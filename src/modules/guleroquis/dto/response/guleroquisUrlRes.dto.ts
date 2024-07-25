import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class GuleroquisUrlResDto {
  @ApiProperty()
  @IsString()
  @Expose()
  url: string;
}
