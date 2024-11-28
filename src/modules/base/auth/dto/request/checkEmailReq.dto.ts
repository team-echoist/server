import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CheckEmailReqDto {
  @ApiProperty({
    description: '중복 검사를 할 이메일 주소',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이어야 합니다.' })
  email: string;
}
