import { IsString, Length, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterReqDto {
  @ApiProperty()
  @IsString()
  @Length(6)
  code: string;
}
