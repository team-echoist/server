import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProcessReqDto {
  @ApiProperty({
    description: '처리 중인 작업에 대한 선택적 설명',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment: string;

  @ApiProperty({
    description: '처리할 작업의 유형입니다. 승인됨, 거부됨, 보류 중 중 하나여야 합니다',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['approved', 'rejected', 'pending'])
  actionType: 'approved' | 'rejected' | 'pending';
}
