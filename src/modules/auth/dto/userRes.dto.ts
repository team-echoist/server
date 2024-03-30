import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Exclude } from 'class-transformer';

export class UserResDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @Exclude()
  password: string;

  @Exclude()
  birthDate: Date;

  @Exclude()
  gender: string;
}
