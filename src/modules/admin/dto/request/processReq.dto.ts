import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ActionType } from '../../../../entities/processedHistory.entity';

export class ProcessReqDto {
  @ApiProperty({
    description: '처리 중인 작업에 대한 코멘트',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({
    description: 'approved: 승인, rejected: 기각, pending: 보류',
  })
  @IsEnum(ActionType)
  @IsNotEmpty()
  actionType: ActionType;
}
