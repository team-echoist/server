import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

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
  marketing?: boolean;
}
