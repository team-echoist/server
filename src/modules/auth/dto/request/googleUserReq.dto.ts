import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleUserReqDto {
  @ApiProperty({ nullable: false })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ nullable: false })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ nullable: false })
  @IsString()
  @IsNotEmpty()
  email: string;
}
