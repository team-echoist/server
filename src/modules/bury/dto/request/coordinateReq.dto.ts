import { IsLatitude, IsLongitude, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
