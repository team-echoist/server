import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { TagDto } from '../tag.dto';

export class EssayResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsDate()
  @Expose()
  createdDate: Date;

  @ApiProperty()
  @IsDate()
  @Expose()
  updatedDate: Date;

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

  @ApiProperty({ type: [TagDto] })
  @Type(() => TagDto)
  @IsArray()
  @Expose()
  tags: TagDto[];
}
