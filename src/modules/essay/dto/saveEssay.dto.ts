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
import { Story } from '../../../entities/story.entity';
import { Device } from '../../../entities/device.entity';
import { EssayStatus } from '../../../common/types/enum.types';

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
  category?: Story;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsEnum(EssayStatus)
  @IsOptional()
  status?: EssayStatus;

  @IsNotEmpty()
  device: Device;

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
