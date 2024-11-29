import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEmail, IsNumber, IsString } from 'class-validator';

import { DeviceResDto } from '../../../../extensions/management/support/dto/response/deviceRes.dto';
import { LayoutResDto } from '../../../../extensions/user/home/dto/response/layoutRes.dto';

export class UserSummaryResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsEmail()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  @IsString()
  nickname: string;

  @ApiProperty()
  @Expose()
  @IsString()
  profileImage: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  gems: number;

  @ApiProperty()
  @Expose()
  @IsDate()
  createdDate: Date;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isFirst: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  locationConsent: boolean;

  @ApiProperty({ type: [DeviceResDto] })
  @Type(() => DeviceResDto)
  @Expose()
  devices: DeviceResDto[];

  @ApiProperty({ type: [LayoutResDto] })
  @Type(() => LayoutResDto)
  @Expose()
  homeLayouts: LayoutResDto;
}
