import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UserImageReqDto {
  @ApiProperty()
  @IsNotEmpty()
  image: any;
}
