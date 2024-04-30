import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class EssayResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  authorId: number;

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
  @Expose()
  views: number;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  publish: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  linkedOut: boolean;

  @ApiProperty()
  @IsNumber()
  @Expose()
  categoryId: number;

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
