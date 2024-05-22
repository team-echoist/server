import { IsDate, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../../../entities/user.entity';

export class UpdateUserReqDto {
  @ApiProperty({ description: '최소 2자, 최대 8자', required: false })
  @IsOptional()
  @Length(2, 15)
  @IsString()
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

  @ApiProperty({ description: 'active, monitored, banned' })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
