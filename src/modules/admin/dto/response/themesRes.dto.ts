import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ThemeResDto } from './themeRes.dto';

export class ThemesResDto {
  @ApiProperty()
  @Expose()
  themes: ThemeResDto[];
}
