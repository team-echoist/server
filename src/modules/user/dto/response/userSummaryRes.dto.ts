import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEmail, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceResDto } from '../../../support/dto/response/deviceRes.dto';

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
}
