import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CategoryNameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  name: string;
}
