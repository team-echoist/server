import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsDate, IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../../../../entities/user.entity';

export class FullUserResDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsEmail()
  email: string;

  @ApiProperty()
  @Expose()
  @IsString()
  nickname: string;

  @ApiProperty()
  @Exclude()
  @IsString()
  password: string;

  @ApiProperty()
  @Expose()
  @IsString()
  gender: string;

  @ApiProperty()
  @Expose()
  @IsString()
  profileImage: string;

  @ApiProperty()
  @Expose()
  @IsDate()
  birthDate: Date;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  platform: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  platformId: string;

  @ApiProperty()
  @Expose()
  @IsString()
  role: string;

  @ApiProperty({
    enum: UserStatus,
  })
  @IsEnum(UserStatus)
  @Expose()
  status: UserStatus;

  @ApiProperty()
  @Expose()
  @IsNumber()
  reputation: number;

  @ApiProperty()
  @Expose()
  @IsDate()
  subscriptionEnd: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  createdDate: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  updatedDate: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  deactivationDate: Date;

  @ApiProperty()
  @Expose()
  @IsDate()
  deletedDate: Date;
}
