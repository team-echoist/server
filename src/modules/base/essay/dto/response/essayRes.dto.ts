import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { TagDto } from '../tag.dto';
import { StoryDto } from '../../../../features/content/story/dto/story.dto';
import { ReviewQueue } from '../../../../../entities/reviewQueue.entity';
import { ReviewResDto } from '../../../../features/contact/review/dto/response/reviewRes.dto';
import { UserSummaryResDto } from '../../../user/dto/response/userSummaryRes.dto';
import { EssayStatus } from '../../../../../common/types/enum.types';

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

  @ApiProperty({ type: UserSummaryResDto })
  @Type(() => UserSummaryResDto)
  @Expose()
  author: UserSummaryResDto;

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
