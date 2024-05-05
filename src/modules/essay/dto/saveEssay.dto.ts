import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { User } from '../../../entities/user.entity';
import { Category } from '../../../entities/category.entity';

export class SaveEssayDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  linkedOutGauge: number;

  @IsOptional()
  category: Category;

  @IsOptional()
  @IsString()
  thumbnail: string;

  @IsNotEmpty()
  @IsBoolean()
  published: boolean;

  @IsNotEmpty()
  @IsBoolean()
  linkedOut: boolean;

  @IsNotEmpty()
  @IsString()
  device: string;

  @IsNotEmpty()
  author: User;
}
