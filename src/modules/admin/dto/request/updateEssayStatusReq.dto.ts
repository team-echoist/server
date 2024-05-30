import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EssayStatus } from '../../../../entities/essay.entity';

export class UpdateEssayStatusReqDto {
  @ApiProperty({ description: 'private, published, linkedout' })
  @IsEnum(EssayStatus)
  status: EssayStatus;
}
