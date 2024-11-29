import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class UserLimitedInfoResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  nickname: string;

  @ApiProperty()
  @Expose()
  @IsString()
  profileImage: string;
}
