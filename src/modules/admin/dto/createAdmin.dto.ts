import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  role: string;
}
