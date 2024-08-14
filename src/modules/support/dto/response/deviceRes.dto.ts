import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceOS, DeviceType } from '../../../../common/types/enum.types';

export class DeviceResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  uid: string;

  @ApiProperty()
  @Expose()
  @IsString()
  fcmToken: string;

  @ApiProperty()
  @Expose()
  @IsEnum(DeviceOS)
  os: DeviceOS;

  @ApiProperty()
  @Expose()
  @IsEnum(DeviceType)
  type: DeviceType;

  @ApiProperty()
  @Expose()
  model: string;
}
