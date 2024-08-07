import { DeviceOS, DeviceType } from '../../../../entities/device.entity';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DeviceResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  deviceId: string;

  @ApiProperty()
  @Expose()
  @IsString()
  deviceToken: string;

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
