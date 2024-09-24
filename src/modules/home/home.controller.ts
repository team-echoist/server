import { Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GeulroquisUrlResDto } from '../geulroquis/dto/response/geulroquisUrlRes.dto';
import { JwtAuthGuard } from '../../common/guards/jwtAuth.guard';
import { Request as ExpressRequest, Response } from 'express';

@ApiTags('Home')
@Controller('home')
@UseGuards(JwtAuthGuard)
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('geulroquis')
  @ApiOperation({
    summary: '오늘의 글로키 이미지 주소 조회',
    description: `
  매일 자정마다 초기화되는 글로키 이미지 주소를 조회합니다.

  **주의 사항:**
  - 유효하지 않은 토큰을 제공하면 \`404 Not Found\` 에러가 발생합니다.
  `,
  })
  @ApiResponse({ status: 200, type: GeulroquisUrlResDto })
  async todayGeulroquis() {
    return this.homeService.todayGeulroquis();
  }

  @Get('themes')
  @ApiOperation({
    summary: '테마 리스트',
    description: `
  제공중인 모든 테마를 조회합니다.
    
  **동작 과정:**
  1. 최초 조회시 기본으로 'Workaholic' 테마를 획득합니다.
  2. 유저가 소유한 테마를 조회합니다.
  3. 서비스가 제공중인 테마를 조회합니다.
  4. 유저와 서비스의 테마리스트를 비교하여 소유 여부를 추가합니다.
  5. 리스트를 반환합니다.
  `,
  })
  @ApiResponse({ status: 200 })
  async getThemes(@Req() req: ExpressRequest) {
    return this.homeService.getThemes(req.user.id);
  }

  @Post('themes/buy/:themeId')
  @ApiOperation({
    summary: '테마 구입',
  })
  @ApiResponse({ status: 201 })
  async buyTheme(@Req() req: ExpressRequest, @Param('themeId', ParseIntPipe) themeId: number) {
    return this.homeService.buyTheme(req.user.id, themeId);
  }
}
