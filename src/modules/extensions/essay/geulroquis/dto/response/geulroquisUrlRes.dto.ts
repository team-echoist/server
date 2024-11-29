import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class GeulroquisUrlResDto {
  @ApiProperty()
  @IsString()
  @Expose()
  url: string;
}
