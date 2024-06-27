import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ReviewResDto } from './reviewRes.dto';

export class ReviewsResDto {
  @ApiProperty({ type: [ReviewResDto] })
  @Expose()
  reviews: ReviewResDto[];

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
