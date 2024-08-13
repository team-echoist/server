import { IsEnum, IsString } from 'class-validator';
import { DeviceOS, DeviceType } from '../../../common/types/enum.types';

export class DeviceDto {
  @IsEnum(DeviceOS)
  os: DeviceOS;

  @IsEnum(DeviceType)
  type: DeviceType;

  @IsString()
  model: string;
}
