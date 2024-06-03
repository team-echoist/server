import { StoriesDto } from '../stories.dto';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StoriesResDto {
  @ApiProperty({ type: [StoriesDto] })
  @Expose()
  stories: StoriesDto[];
}
