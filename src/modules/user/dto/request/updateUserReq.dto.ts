import { IsDate, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserReqDto {
  @ApiProperty({})
  @IsString()
  @IsOptional()
  @Length(1, 20, {
    message: '닉네임은 최소 1자 이상, 최대 20자 이하이어야 합니다.',
  })
  @Matches(/^[a-zA-Z0-9가-힣_]+$/, {
    message: '닉네임은 영문자, 숫자, 밑줄(_)만 포함할 수 있습니다.',
  })
  nickname?: string;

  @ApiProperty({
    description: '최소 8자, 영문자 1개, 숫자 1개, 특수문자 1개 이상',
  })
  @IsOptional()
  @IsString()
  @Length(8, 30)
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/)
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  birthDate?: Date;
}
