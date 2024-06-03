import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { User } from '../../../entities/user.entity';
import { Category } from '../../../entities/category.entity';
import { EssayStatus } from '../../../entities/essay.entity';

export class SaveEssayDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  linkedOutGauge?: number;

  @IsOptional()
  category?: Category;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsEnum(EssayStatus)
  @IsOptional()
  status?: EssayStatus;

  @IsNotEmpty()
  @IsString()
  device: string;

  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNotEmpty()
  author: User;
}
