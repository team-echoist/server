import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class GeulroquisUrlResDto {
  @ApiProperty()
  @IsString()
  @Expose()
  url: string;
}
