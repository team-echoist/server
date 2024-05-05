import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ReviewsDto } from './reviews.dto';

export class ReviewResDto {
  @ApiProperty({ type: [ReviewsDto] })
  @Expose()
  reviews: ReviewsDto[];

  @ApiProperty()
  @Expose()
  totalPage: number;

  @ApiProperty()
  @Expose()
  page: number;

  @ApiProperty()
  @Expose()
  total: number;
}
