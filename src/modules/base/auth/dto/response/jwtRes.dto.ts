import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

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
