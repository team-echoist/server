import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OauthMobileReqDto {
  @ApiProperty({ description: '플랫폼이 사용자에게 제공한 토큰', nullable: false })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: '플랫폼이 제공하는 사용자의 고유 ID', nullable: false })
  @IsString()
  @IsNotEmpty()
  platformId: string;
}
