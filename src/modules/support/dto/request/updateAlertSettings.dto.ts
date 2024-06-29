import { IsBoolean, IsOptional, IsString } from 'class-validator';
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
  timeAllowed?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  alertStart?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  alertEnd?: string;
}
