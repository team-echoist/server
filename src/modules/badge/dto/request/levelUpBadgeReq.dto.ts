import { IsNotEmpty, IsString } from 'class-validator';

export class LevelUpBadgeReqDto {
  @IsString()
  @IsNotEmpty()
  badgeName: string;
}
