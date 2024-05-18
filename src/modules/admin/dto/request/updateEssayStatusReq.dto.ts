import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateEssayStatusReqDto {
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  linkedOut?: boolean;
}
