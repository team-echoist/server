import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsString,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { TagDto } from '../tag.dto';
import { EssayStatus } from '../../../../entities/essay.entity';
import { LimitedUserDto } from '../../../user/dto/limitedUser.dto';

export class PublicEssaysResDto {
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
  @IsLatitude()
  @Expose()
  latitude: number;

  @ApiProperty()
  @IsLongitude()
  @Expose()
  longitude: number;

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
