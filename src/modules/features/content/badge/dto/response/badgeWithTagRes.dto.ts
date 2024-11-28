import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class BadgeWithTagResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Expose()
  level: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  exp: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @Expose()
  tags: string[];
}
