import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  birthDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  oauthInfo?: object;
}
