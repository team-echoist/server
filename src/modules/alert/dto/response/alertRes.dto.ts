import { AlertType } from '../../../../entities/alert.entity';
import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AlertResDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  title: string;

  @ApiProperty()
  @IsString()
  @Expose()
  content: string;

  @ApiProperty()
  @IsString()
  @Expose()
  body: string;

  @ApiProperty()
  @IsEnum(AlertType)
  @Expose()
  type: AlertType;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  read: boolean;

  @ApiProperty()
  @IsString()
  @Expose()
  createdDate: string;
}
