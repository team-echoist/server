import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
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
  marketing: boolean;
}
