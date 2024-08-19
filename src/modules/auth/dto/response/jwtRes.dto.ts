import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class JwtResDto {
  @ApiProperty()
  @Expose()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @Expose()
  @IsString()
  refreshToken: string;
}
