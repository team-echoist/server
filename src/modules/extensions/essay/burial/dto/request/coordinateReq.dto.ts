import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNotEmpty } from 'class-validator';

export class CoordinateReqDto {
  @ApiProperty()
  @IsLatitude()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty()
  @IsLongitude()
  @IsNotEmpty()
  longitude: number;
}
