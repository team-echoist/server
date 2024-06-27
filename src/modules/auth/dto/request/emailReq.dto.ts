import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
