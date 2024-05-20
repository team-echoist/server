import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UserImageReqDto {
  @ApiProperty({ description: '사용자 프로필 이미지 파일' })
  @IsNotEmpty()
  image: any;
}
