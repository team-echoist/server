import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAlertSettingsReqDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  viewed?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  report?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  marketing: boolean;
}
