import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';

import { AlertType } from '../../../../../../common/types/enum.types';
import { EssayIdResDto } from '../../../../../base/essay/dto/response/essayIdRes.dto';

export class AlertResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  title: string;

  @ApiProperty()
  @IsString()
  @Expose()
  content: string;

  @ApiProperty()
  @IsString()
  @Expose()
  body: string;

  @ApiProperty()
  @IsEnum(AlertType)
  @Expose()
  type: AlertType;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  read: boolean;

  @ApiProperty()
  @IsString()
  @Expose()
  createdDate: string;

  @ApiProperty({ type: EssayIdResDto })
  @Expose()
  @Type(() => EssayIdResDto)
  essay: EssayIdResDto;
}
