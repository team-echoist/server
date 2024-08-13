import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { ReviewQueueType } from '../../../../common/types/enum.types';

export class ReviewResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsEnum(ReviewQueueType)
  type: ReviewQueueType;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  processed: boolean;
}
