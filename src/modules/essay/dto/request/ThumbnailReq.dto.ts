import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ThumbnailReqDto {
  @ApiProperty()
  @IsNotEmpty()
  image: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  essayId?: string;
}
