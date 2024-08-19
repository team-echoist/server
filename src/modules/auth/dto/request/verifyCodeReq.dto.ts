import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeReqDto {
  @ApiProperty()
  @IsString()
  @Length(6)
  code: string;
}
