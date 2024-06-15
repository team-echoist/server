import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { TagDto } from '../tag.dto';
import { EssayStatus } from '../../../../entities/essay.entity';
import { UserSummaryResDto } from '../../../user/dto/response/userSummaryRes.dto';
import { StoryDto } from '../../../story/dto/story.dto';

// todo 스키마로 변경
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
  @IsNumber()
  @Exclude()
  views: number;

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
  @IsLatitude()
  @Expose()
  latitude: number;

  @ApiProperty()
  @IsLongitude()
  @Expose()
  longitude: number;

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

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @Expose()
  isBookmarked?: boolean;
}
