import { IsEnum, IsString } from 'class-validator';
import { DeviceType, UserOS } from '../../../entities/device.entity';

export class DeviceDto {
  @IsEnum(UserOS)
  os: UserOS;

  @IsEnum(DeviceType)
  type: DeviceType;

  @IsString()
  model: string;
}
