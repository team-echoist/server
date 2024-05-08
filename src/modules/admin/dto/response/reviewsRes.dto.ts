import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ReviewDto } from '../review.dto';

export class ReviewsResDto {
  @ApiProperty({ type: [ReviewDto] })
  @Expose()
  reviews: ReviewDto[];

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
