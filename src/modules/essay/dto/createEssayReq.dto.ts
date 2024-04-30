import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEssayReqDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
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
  @IsOptional()
  @IsBoolean()
  publish: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  linkedOut: boolean;
}
