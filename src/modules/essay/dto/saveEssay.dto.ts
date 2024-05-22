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
import { Expose } from 'class-transformer';
import { EssayStatus } from '../../../entities/essay.entity';

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

  @IsEnum(EssayStatus)
  @IsOptional()
  @Expose()
  status?: EssayStatus;

  @IsNotEmpty()
  @IsString()
  @Expose()
  device: string;

  @IsLatitude()
  @IsOptional()
  @Expose()
  latitude?: number;

  @IsLongitude()
  @IsOptional()
  @Expose()
  longitude?: number;

  @IsString()
  @IsOptional()
  @Expose()
  location?: string;

  @IsNotEmpty()
  @Expose()
  author: User;
}
