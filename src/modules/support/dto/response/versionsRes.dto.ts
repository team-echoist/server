import { AppType } from '../../../../entities/appVersions.entity';
import { IsDateString, IsEnum, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class VersionsResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsEnum(AppType)
  @Expose()
  appType: AppType;

  @ApiProperty()
  @IsString()
  @Expose()
  version: string;

  @ApiProperty()
  @IsDateString()
  @Expose()
  releaseDate: Date;

  @ApiProperty()
  @IsDateString()
  @Expose()
  createdDate: Date;

  @ApiProperty()
  @IsDateString()
  @Expose()
  updatedDate: Date;
}
