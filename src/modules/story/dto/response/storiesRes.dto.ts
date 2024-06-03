import { StoryDto } from '../story.dto';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StoriesResDto {
  @ApiProperty({ type: [StoryDto] })
  @Expose()
  stories: StoryDto[];
}
