import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateAdminReqDto {
  @ApiProperty({
    description: '관리자 이메일',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: '최소 8자, 영문자 1개, 숫자 1개, 특수문자 1개 이상' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 30)
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/)
  password: string;
}
