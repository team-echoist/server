import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { EssayStatus } from '../../../../common/types/enum.types';
import { Device } from '../../../../entities/device.entity';
import { Tag } from '../../../../entities/tag.entity';
import { User } from '../../../../entities/user.entity';

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

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Tag)
  tags?: Tag[];
}
