import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CheckNicknameReqDto {
  @ApiProperty({
    description: '중복 검사를 진행할 닉네임',
  })
  @IsString()
  @Length(3, 20, {
    message: '닉네임은 최소 3자 이상, 최대 20자 이하이어야 합니다.',
  })
  @Matches(/^[a-zA-Z0-9가-힣_]+$/, {
    message: '닉네임은 영문자, 숫자, 밑줄(_)만 포함할 수 있습니다.',
  })
  nickname: string;
}
