import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CheckNicknameReqDto {
  @ApiProperty({
    description: '중복 검사를 진행할 닉네임',
  })
  @IsString()
  @Length(1, 6, {
    message: '닉네임은 최소 1자 이상, 최대 6자 이하이어야 합니다.',
  })
  @Matches(/^[가-힣]+$/, {
    message: '닉네임은 한글만 포함할 수 있습니다.',
  })
  nickname: string;
}
