import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { EssayStatus } from '../../../../entities/essay.entity';

export class UpdateEssayStatusReqDto {
  @ApiProperty({ description: 'private, published, linkedout' })
  @IsEnum(EssayStatus)
  status: EssayStatus;
}
