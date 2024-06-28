import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class DeactivateReqDto {
  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  reasons?: string[];

  @ApiProperty()
  @IsString()
  password: string;
}
