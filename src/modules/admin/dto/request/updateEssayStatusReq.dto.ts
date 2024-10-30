import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EssayStatus } from '../../../../common/types/enum.types';

export class UpdateEssayStatusReqDto {
  @ApiProperty({ description: 'private, public, linkedout' })
  @IsEnum(EssayStatus)
  status: EssayStatus;
}
