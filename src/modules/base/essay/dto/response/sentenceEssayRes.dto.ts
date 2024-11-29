import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsString } from 'class-validator';

import { EssayStatus } from '../../../../../common/types/enum.types';

export class SentenceEssayResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsDateString()
  @Expose()
  createdDate: Date;

  @ApiProperty()
  @IsEnum(EssayStatus)
  @Expose()
  status?: EssayStatus;

  @ApiProperty()
  @IsString()
  @Expose()
  content: string;
}
