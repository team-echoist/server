import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { AdminResDto } from '../../../admin/dto/response/adminRes.dto';

export class ReleaseResDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  release: string;

  @ApiProperty()
  @IsDateString()
  @Expose()
  createdDate: Date;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  @Expose()
  updatedDate?: Date;

  @ApiProperty({ required: false, type: AdminResDto })
  @Type(() => AdminResDto)
  @Expose()
  processor?: AdminResDto;
}
