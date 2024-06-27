import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { UserSummaryResDto } from '../../../user/dto/response/userSummaryRes.dto';

export class InquiriesResDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  @Expose()
  createdDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  @Expose()
  processed: boolean;

  @ApiProperty({ type: UserSummaryResDto })
  @Type(() => UserSummaryResDto)
  user: UserSummaryResDto;
}
