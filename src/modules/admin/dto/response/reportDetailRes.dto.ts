import { ReportDto } from '../report.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { EssayStatus } from '../../../../entities/essay.entity';

export class ReportDetailResDto {
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
  @IsNumber()
  @Expose()
  linkedOutGauge: number;

  @ApiProperty()
  @IsDate()
  @Expose()
  createdDate: Date;

  @ApiProperty()
  @IsDate()
  @Expose()
  updatedDate: Date;

  @ApiProperty()
  @IsString()
  @Expose()
  thumbnail: string;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  bookmarks: boolean;

  @ApiProperty()
  @IsNumber()
  @Expose()
  views: number;

  @ApiProperty({ type: 'enum' })
  @IsNotEmpty()
  @IsEnum(EssayStatus)
  @Expose()
  status: EssayStatus;

  @ApiProperty()
  @IsString()
  @Expose()
  device: string;

  @ApiProperty()
  @IsNumber()
  @Expose()
  authorId: number;

  @ApiProperty({ type: [ReportDto] })
  @Expose()
  reports: ReportDto[];
}
