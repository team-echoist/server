import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';

export class EssayIdResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;
}
