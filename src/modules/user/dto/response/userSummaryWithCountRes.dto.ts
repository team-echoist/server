import { WeeklyEssayCountResDto } from '../../../essay/dto/response/weeklyEssayCountRes.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class UserSummaryWithCountResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  nickname: string;

  @ApiProperty()
  @IsString()
  @Expose()
  profileImage: string;

  @ApiProperty()
  @IsDateString()
  @Expose()
  createdDate: string;

  @ApiProperty({ type: [WeeklyEssayCountResDto] })
  @Expose()
  weeklyEssayCounts: WeeklyEssayCountResDto[];
}
