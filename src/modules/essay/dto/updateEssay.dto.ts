import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Category } from '../../../entities/category.entity';
import { Expose } from 'class-transformer';
import { EssayStatus } from '../../../entities/essay.entity';

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

  @IsEnum(EssayStatus)
  @IsOptional()
  @Expose()
  status: EssayStatus;

  @IsString()
  @IsOptional()
  @Expose()
  location?: string;
}
