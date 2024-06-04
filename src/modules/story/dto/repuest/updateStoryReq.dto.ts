import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class UpdateStoryReqDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @Length(1, 20)
  name?: string;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  essayIds?: number[];
}
