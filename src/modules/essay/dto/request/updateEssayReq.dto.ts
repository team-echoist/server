import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdateEssayReqDto {
  @ApiProperty({ required: false })
  @Expose()
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsString()
  @IsOptional()
  content: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsNumber()
  @IsOptional()
  linkedOutGauge: number;

  @ApiProperty({ required: false })
  @Expose()
  @IsNumber()
  @IsOptional()
  categoryId: number;

  @ApiProperty({ required: false })
  @Expose()
  @IsString()
  @IsOptional()
  thumbnail: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsBoolean()
  @IsOptional()
  published: boolean;

  @ApiProperty({ required: false })
  @Expose()
  @IsBoolean()
  @IsOptional()
  linkedOut: boolean;
}
