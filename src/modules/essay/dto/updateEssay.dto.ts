import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Category } from '../../../entities/category.entity';
import { Expose } from 'class-transformer';

export class UpdateEssayDto {
  @Expose()
  @IsString()
  @IsOptional()
  title: string;

  @Expose()
  @IsString()
  @IsOptional()
  content: string;

  @Expose()
  @IsNumber()
  @IsOptional()
  linkedOutGauge: number;

  @Expose()
  @IsOptional()
  category: Category;

  @Expose()
  @IsString()
  @IsOptional()
  thumbnail: string;

  @Expose()
  @IsBoolean()
  @IsOptional()
  published: boolean;

  @Expose()
  @IsBoolean()
  @IsOptional()
  linkedOut: boolean;

  @IsString()
  @IsOptional()
  @Expose()
  location?: string;
}
