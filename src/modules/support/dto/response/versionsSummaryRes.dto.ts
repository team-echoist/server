import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class VersionsSummaryResDto {
  @ApiProperty()
  @Expose()
  @IsString()
  android_mobile: string;

  @ApiProperty()
  @Expose()
  @IsString()
  android_tablet: string;

  @ApiProperty()
  @Expose()
  @IsString()
  ios_mobile: string;

  @ApiProperty()
  @Expose()
  @IsString()
  ios_tablet: string;

  @ApiProperty()
  @Expose()
  @IsString()
  desktop_mac: string;

  @ApiProperty()
  @Expose()
  @IsString()
  desktop_windows: string;
}
