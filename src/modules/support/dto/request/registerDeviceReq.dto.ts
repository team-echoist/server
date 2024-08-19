import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegisterDeviceReqDto {
  @ApiProperty()
  @IsString()
  uid: string;

  @ApiProperty()
  @IsString()
  fcmToken: string;
}
