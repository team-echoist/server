import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateFullUserReqDto {
  @ApiProperty({ description: '최소 2자, 최대 8자', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 15)
  nickname?: string;

  @ApiProperty({
    description: '사용자 요청에 의한 변경이 아닌 경우 해당 필드 사용을 권장하지 않습니다',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: '최소 8자, 영문자 1개, 숫자 1개, 특수문자 1개 이상',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(8, 30, { message: 'Password must be between 8 and 20 characters' })
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
  @IsDateString()
  birthDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ description: '사용자가 모니터링되는지 여부를 나타냅니다', required: false })
  @IsOptional()
  @IsBoolean()
  monitored?: boolean;

  @ApiProperty({ description: '사용자가 금지되었는지 여부를 나타냅니다', required: false })
  @IsOptional()
  @IsBoolean()
  banned?: boolean;
}
