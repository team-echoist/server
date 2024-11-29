import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsNumber, IsString } from 'class-validator';

export class StoryUpdateEssayResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  title: string;

  @ApiProperty()
  @IsDateString()
  @Expose()
  createdDate: Date;

  @ApiProperty({ required: false })
  @IsNumber()
  @Expose()
  story: number;
}
