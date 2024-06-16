import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason: string;
}
