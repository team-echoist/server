import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LimitedUserDto {
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
