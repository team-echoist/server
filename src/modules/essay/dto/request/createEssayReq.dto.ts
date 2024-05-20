import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateEssayReqDto {
  @ApiProperty({ description: '30자 제한' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 30)
  title: string;

  @ApiProperty({ description: '4000자 제한' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 4000)
  content: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  linkedOutGauge?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  published: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  linkedOut: boolean;

  @ApiProperty({
    description: '에세이와 연결시킬 태그들. 최대 4개',
    required: false,
    type: [String],
    maxItems: 4,
  })
  @IsArray()
  @ArrayMaxSize(4)
  @IsOptional()
  tags?: string[];
}
