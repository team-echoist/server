import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { User } from '../../../entities/user.entity';
import { Category } from '../../../entities/category.entity';
import { Expose } from 'class-transformer';

export class SaveEssayDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  title: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  content: string;

  @IsOptional()
  @IsNumber()
  @Expose()
  linkedOutGauge?: number;

  @IsOptional()
  @Expose()
  category?: Category;

  @IsOptional()
  @IsString()
  @Expose()
  thumbnail?: string;

  @IsNotEmpty()
  @IsBoolean()
  @Expose()
  published: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @Expose()
  linkedOut: boolean;

  @IsNotEmpty()
  @IsString()
  @Expose()
  device: string;

  @IsNotEmpty()
  @Expose()
  author: User;
}