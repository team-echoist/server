import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class ThemeResDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Expose()
  url: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  @Expose()
  owned: boolean;
}
