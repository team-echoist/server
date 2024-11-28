import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class EssayIdsReqDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  essayIds: number[];
}
