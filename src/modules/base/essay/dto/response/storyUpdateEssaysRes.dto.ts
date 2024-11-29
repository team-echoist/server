import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

import { StoryUpdateEssayResDto } from './storyUpdateEssayRes.dto';

export class StoryUpdateEssaysResDto {
  @ApiProperty({ type: [StoryUpdateEssayResDto] })
  @Expose()
  essays: StoryUpdateEssayResDto[];

  @ApiProperty()
  @IsNumber()
  @Expose()
  total: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  page: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  totalPage: number;

  @ApiProperty()
  @IsString()
  @Expose()
  currentStoryName: string;
}
