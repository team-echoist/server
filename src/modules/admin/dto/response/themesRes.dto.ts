import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class ThemeResDto {
  @ApiProperty()
  @IsString()
  @Expose()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Expose()
  price: number;

  @ApiProperty()
  @IsString()
  @Expose()
  url: string;
}
