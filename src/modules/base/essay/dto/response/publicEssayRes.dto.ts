import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsString } from 'class-validator';

import { EssayStatus } from '../../../../../common/types/enum.types';
import { LimitedUserDto } from '../../../user/dto/limitedUser.dto';
import { TagDto } from '../tag.dto';

export class PublicEssayResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsDateString()
  @Expose()
  createdDate: Date;

  @ApiProperty()
  @IsDateString()
  @Expose()
  updatedDate: Date;

  @ApiProperty()
  @IsNumber()
  @Exclude()
  views: number;

  @ApiProperty()
  @IsEnum(EssayStatus)
  @Expose()
  status?: EssayStatus;

  @ApiProperty()
  @IsNumber()
  @Expose()
  linkedOutGauge: number;

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

  @ApiProperty()
  @IsString()
  @Expose()
  location: string;

  @ApiProperty({ type: [TagDto] })
  @Type(() => TagDto)
  @IsArray()
  @Expose()
  tags: TagDto[];

  @ApiProperty({ type: LimitedUserDto })
  @Type(() => LimitedUserDto)
  @Expose()
  author: LimitedUserDto;
}
