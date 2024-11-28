import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsNumber, IsString } from 'class-validator';

export class StoryDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  name: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createdDate: Date;

  @ApiProperty()
  @Expose()
  @IsNumber()
  essaysCount: number;
}
