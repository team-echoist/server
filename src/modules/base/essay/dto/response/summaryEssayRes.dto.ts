import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { EssayStatus } from '../../../../../common/types/enum.types';
import { UserLimitedInfoResDto } from '../../../user/dto/response/userLimitedInfoRes.dto';

export class SummaryEssayResDto {
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
  status: EssayStatus;

  @ApiProperty()
  @IsString()
  @Expose()
  thumbnail: string;

  @ApiProperty()
  @IsString()
  @Expose()
  title: string;

  @ApiProperty()
  @IsString()
  @Expose()
  content: string;

  @ApiProperty({ type: UserLimitedInfoResDto })
  @Type(() => UserLimitedInfoResDto)
  @Expose()
  author: UserLimitedInfoResDto;

  @ApiProperty()
  @IsString()
  @Expose()
  location: string;
}
