import { ApiProperty } from '@nestjs/swagger';
import { GeulroquisDto } from './geulroquis.dto';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GeulroquisResDto {
  @ApiProperty({ type: [GeulroquisDto] })
  @Expose()
  geulroquis: GeulroquisDto[];

  @ApiProperty()
  @IsNumber()
  @Expose()
  total: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  page: number;
}
