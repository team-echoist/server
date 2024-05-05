import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProcessReqDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  comment: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  result: 'Approved' | 'Rejected' | 'Pending';
}
