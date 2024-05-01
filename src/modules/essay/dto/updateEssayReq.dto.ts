import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEssayReqDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  content: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  linkedOutGauge: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  categoryId: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  thumbnail: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  publish: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  linkedOut: boolean;
}
