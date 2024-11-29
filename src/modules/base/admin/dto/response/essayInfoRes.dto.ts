import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { EssayDto } from '../../../essay/dto/essay.dto';
import { UserDto } from '../../../user/dto/user.dto';

export class EssayInfoResDto extends EssayDto {
  @ApiProperty()
  @Expose()
  @Type(() => UserDto)
  author: UserDto;
}
