import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class AlertSettingsResDto {
  @ApiProperty()
  @IsBoolean()
  @Expose()
  viewed: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  report: boolean;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  timeAllowed: boolean;

  @ApiProperty()
  @IsString()
  @Expose()
  alertStart: string;

  @ApiProperty()
  @IsString()
  @Expose()
  alertEnd: string;
}
