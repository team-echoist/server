import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CheckEmailReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
