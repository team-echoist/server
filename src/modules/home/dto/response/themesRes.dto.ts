import { ThemeResDto } from './themeRes.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ThemesResDto {
  @ApiProperty({ type: [ThemeResDto] })
  themes: ThemeResDto[];
}
