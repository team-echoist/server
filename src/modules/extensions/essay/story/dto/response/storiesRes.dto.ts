import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { StoryDto } from '../story.dto';

export class StoriesResDto {
  @ApiProperty({ type: [StoryDto] })
  @Expose()
  stories: StoryDto[];
}
