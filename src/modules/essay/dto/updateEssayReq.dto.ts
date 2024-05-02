import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEssayReqDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  linkedOutGauge: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  categoryId: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  published: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  linkedOut: boolean;
}
