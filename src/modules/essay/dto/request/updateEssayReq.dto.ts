import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Expose } from 'class-transformer';
import { EssayStatus } from '../../../../entities/essay.entity';

export class UpdateEssayReqDto {
  @ApiProperty({ description: '30자 제한' })
  @IsString()
  @IsOptional()
  @Length(1, 30)
  title?: string;

  @ApiProperty({ description: '4000자 제한' })
  @IsString()
  @IsOptional()
  @Length(10, 4000)
  content?: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsNumber()
  @IsOptional()
  linkedOutGauge?: number;

  @ApiProperty({ required: false })
  @Expose()
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ required: false })
  @Expose()
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ type: 'enum', description: 'private, published, linked_out' })
  @IsEnum(EssayStatus)
  @IsOptional()
  status?: EssayStatus;

  @ApiProperty({
    description: '장소 이름',
    required: false,
  })
  @Length(1, 20)
  @IsString()
  @Expose()
  @IsOptional()
  location?: string;

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
