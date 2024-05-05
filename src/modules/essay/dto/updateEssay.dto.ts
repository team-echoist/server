import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Category } from '../../../entities/category.entity';

export class UpdateEssayDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  linkedOutGauge: number;

  @ApiProperty({ required: false })
  @IsOptional()
  category: Category;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  published: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  linkedOut: boolean;
}
