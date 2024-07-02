import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { ReportDto } from '../report.dto';
import { ReviewResDto } from './reviewRes.dto';
import { UserDto } from '../../../user/dto/user.dto';
import { EssayDto } from '../../../essay/dto/essay.dto';
import { ActionType } from '../../../../entities/processedHistory.entity';
import { AdminResDto } from './adminRes.dto';
import { NoticeResDto } from '../../../support/dto/response/noticeRes.dto';
import { InquiryResDto } from '../../../support/dto/response/inquiryRes.dto';

export class HistoriesResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty({ type: 'enum' })
  @Expose()
  @IsEnum(ActionType)
  actionType: ActionType;

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

  @ApiProperty({ type: () => AdminResDto })
  @Expose()
  @Type(() => AdminResDto)
  processor: AdminResDto;

  @ApiProperty()
  @Expose()
  @IsDate()
  processedDate: Date;

  @ApiProperty({ type: () => ReportDto })
  @Type(() => ReportDto)
  @Expose()
  report: ReportDto;

  @ApiProperty({ type: () => ReviewResDto })
  @Type(() => ReviewResDto)
  @Expose()
  review: ReviewResDto;

  @ApiProperty({ type: () => UserDto })
  @Type(() => UserDto)
  @Expose()
  user: UserDto;

  @ApiProperty({ type: () => EssayDto })
  @Type(() => EssayDto)
  @Expose()
  essay: EssayDto;

  @ApiProperty({ type: () => NoticeResDto })
  @Type(() => NoticeResDto)
  @Expose()
  notice: NoticeResDto;

  @ApiProperty({ type: () => InquiryResDto })
  @Type(() => InquiryResDto)
  @Expose()
  inquiry: InquiryResDto;
}
