import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateUserReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail({}, { message: '올바른 이메일 형식이어야 합니다.' })
  email: string;

  @ApiProperty({
    description:
      '최소 8자, 영문자 1개, 숫자 1개, 특수문자 1개 이상. oauth를 통한 가입자를 위해 옵션으로 설정되어 있습니다.',
  })
  @IsOptional()
  @IsString()
  @Length(8, 30)
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/)
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  platform: string;

  @ApiProperty({ required: false })
  @IsOptional()
  platformId: string;
}
