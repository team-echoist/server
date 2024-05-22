import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class LimitedUserDto {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  nickname: string;

  @Expose()
  @IsString()
  profileImage: string;
}
