import { IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterReqDto {
  @ApiProperty()
  @IsString()
  @Min(6)
  @Max(6)
  code: string;
}
