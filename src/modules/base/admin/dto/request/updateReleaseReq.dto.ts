import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateReleaseReqDto {
  @ApiProperty()
  @IsString()
  content: string;
}
