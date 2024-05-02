import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

export class EssayResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsDate()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @IsNumber()
  @Exclude()
  views: number;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  published: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  linkedOut: boolean;

  @ApiProperty()
  @IsNumber()
  @Expose()
  linkedOutGauge: number;

  @ApiProperty()
  @IsString()
  @Expose()
  thumbnail: string;

  @ApiProperty()
  @IsString()
  @Expose()
  title: string;

  @ApiProperty()
  @IsString()
  @Expose()
  content: string;
}
