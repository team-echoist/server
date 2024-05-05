import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProcessReqDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comment: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  result: 'Approved' | 'Rejected' | 'Pending';
}
