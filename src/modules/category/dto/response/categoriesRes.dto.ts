import { CategoriesDto } from '../categories.dto';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CategoriesResDto {
  @ApiProperty({ type: [CategoriesDto] })
  @Expose()
  categories: CategoriesDto[];
}
