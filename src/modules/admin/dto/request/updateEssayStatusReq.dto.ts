import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateEssayStatusReqDto {
  @ApiProperty({ description: '에세이 출판 상태를 결정하는 불린', required: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiProperty({ description: '에세이 링크 상태를 결정하는 불린', required: false })
  @IsBoolean()
  @IsOptional()
  linkedOut?: boolean;
}
