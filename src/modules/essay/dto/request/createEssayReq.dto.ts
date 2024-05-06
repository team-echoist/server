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
  @IsOptional()
  @IsBoolean()
  published: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  linkedOut: boolean;
}
