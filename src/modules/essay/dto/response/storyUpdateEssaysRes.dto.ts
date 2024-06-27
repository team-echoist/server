import { StoryUpdateEssayResDto } from './storyUpdateEssayRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

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
}
