import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ThumbnailReqDto {
  @ApiProperty({ description: '썸네일용 이미지 파일' })
  @IsNotEmpty()
  image: any;

  @ApiProperty({ description: '에세이 작성, 수정 등 유동적으로 사용하기 위한 옵션 필드' })
  @IsString()
  @IsOptional()
  essayId?: string;
}
