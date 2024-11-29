import { ApiProperty } from '@nestjs/swagger';

import { ThemeResDto } from './themeRes.dto';

export class ThemesResDto {
  @ApiProperty({ type: [ThemeResDto] })
  themes: ThemeResDto[];
}
