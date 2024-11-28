import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Story } from '../../../../entities/story.entity';
import { Expose } from 'class-transformer';
import { EssayStatus } from '../../../../common/types/enum.types';

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
  story: Story;

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
