import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';
import { ReportDto } from '../report.dto';
import { ReviewDto } from '../review.dto';
import { UserDto } from '../../../user/dto/user.dto';
import { EssayDto } from '../../../essay/dto/essay.dto';

export class HistoriesResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  actionType: string;

  @ApiProperty()
  @Expose()
  @IsString()
  target: string;

  @ApiProperty()
  @Expose()
  @IsString()
  comment: string;

  @ApiProperty()
  @Expose()
  @IsString()
  result: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  processor: number;

  @ApiProperty()
  @Expose()
  @IsDate()
  processedDate: Date;

  @ApiProperty({ type: () => ReportDto })
  @Type(() => ReportDto)
  @Expose()
  report: ReportDto;

  @ApiProperty({ type: () => ReviewDto })
  @Type(() => ReviewDto)
  @Expose()
  review: ReviewDto;

  @ApiProperty({ type: () => UserDto })
  @Type(() => UserDto)
  @Expose()
  user: UserDto;

  @ApiProperty({ type: () => EssayDto })
  @Type(() => EssayDto)
  @Expose()
  essay: EssayDto;
}
