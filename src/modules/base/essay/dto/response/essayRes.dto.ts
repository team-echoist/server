import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { EssayStatus } from '../../../../../common/types/enum.types';
import { ReviewQueue } from '../../../../../entities/reviewQueue.entity';
import { StoryDto } from '../../../../extensions/essay/story/dto/story.dto';
import { ReviewResDto } from '../../../../extensions/management/review/dto/response/reviewRes.dto';
import { UserLimitedInfoResDto } from '../../../user/dto/response/userLimitedInfoRes.dto';
import { TagDto } from '../tag.dto';

export class EssayResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsDateString()
  @Expose()
  createdDate: Date;

  @ApiProperty()
  @IsDateString()
  @Expose()
  updatedDate: Date;

  @ApiProperty()
  @IsEnum(EssayStatus)
  @Expose()
  status?: EssayStatus;

  @ApiProperty()
  @IsNumber()
  @Expose()
  linkedOutGauge: number;

  @ApiProperty()
  @IsString()
  @Expose()
  thumbnail: string;

  @ApiProperty()
  @IsString()
  @Expose()
  title: string;

  @ApiProperty()
  @IsString()
  @Expose()
  content: string;

  @ApiProperty()
  @IsString()
  @Expose()
  location: string;

  @ApiProperty({ type: [TagDto] })
  @Type(() => TagDto)
  @IsArray()
  @Expose()
  tags: TagDto[];

  @ApiProperty({ type: UserLimitedInfoResDto })
  @Type(() => UserLimitedInfoResDto)
  @Expose()
  author: UserLimitedInfoResDto;

  @ApiProperty({ type: StoryDto })
  @Type(() => StoryDto)
  @Expose()
  story: StoryDto;

  @ApiProperty({ type: [ReviewResDto] })
  @Type(() => ReviewResDto)
  @Expose()
  reviews: ReviewQueue[];

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @Expose()
  isBookmarked?: boolean;
}
