import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class StoryInfoDto {
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsDate()
  createdDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsDate()
  updatedDate: Date;
}
