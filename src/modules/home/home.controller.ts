import { Controller, Get, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GuleroquisUrlResDto } from '../guleroquis/dto/response/guleroquisUrlRes.dto';

@Controller('home')
@UseGuards(AuthGuard('jwt'))
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('guleroquis')
  @ApiOperation({
    summary: '오늘의 글루키 이미지 주소 조회',
    description: `
  매일 자정마다 초기화되는 글루키 이미지 주소를 조회합니다.

  **주의 사항:**
  - 유효하지 않은 토큰을 제공하면 \`404 Not Found\` 에러가 발생합니다.
  `,
  })
  @ApiResponse({ status: 200, type: GuleroquisUrlResDto })
  async todayGuleroquis() {
    return this.homeService.todayGuleroquis();
  }
}
