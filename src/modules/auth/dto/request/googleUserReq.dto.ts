import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleUserReqDto {
  @ApiProperty({ description: 'Google이 사용자에게 제공한 토큰', nullable: false })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Google에서 제공하는 사용자의 고유 ID', nullable: false })
  @IsString()
  @IsNotEmpty()
  id: string;
}
