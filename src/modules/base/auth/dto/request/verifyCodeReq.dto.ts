import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyCodeReqDto {
  @ApiProperty()
  @IsString()
  @Length(6)
  code: string;
}
