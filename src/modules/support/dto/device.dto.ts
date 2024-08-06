import { IsEnum, IsString } from 'class-validator';
import { DeviceType, DeviceOS } from '../../../entities/device.entity';

export class DeviceDto {
  @IsEnum(DeviceOS)
  os: DeviceOS;

  @IsEnum(DeviceType)
  type: DeviceType;

  @IsString()
  model: string;
}
