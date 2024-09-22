import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class ItemResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  name: string;

  @ApiProperty()
  @IsString()
  @Expose()
  position: string;

  @ApiProperty()
  @IsNumber()
  @Expose()
  price: number;

  @ApiProperty()
  @IsString()
  @Expose()
  url: string;
}
