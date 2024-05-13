import { EssayDto } from '../../../essay/dto/essay.dto';
import { UserDto } from '../../../user/dto/user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class DetailReviewResDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  type: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  @Expose()
  processed: boolean;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  @Expose()
  createdDate: Date;

  @ApiProperty()
  @IsDate()
  @IsOptional()
  @Expose()
  processedDate: Date;

  @ApiProperty({ type: () => EssayDto })
  @Type(() => EssayDto)
  @IsNotEmpty()
  @Expose()
  essay: EssayDto;

  @ApiProperty({ type: () => UserDto })
  @Type(() => UserDto)
  @IsNotEmpty()
  @Expose()
  user: UserDto;
}
