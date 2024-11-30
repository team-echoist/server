import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../../../../../common/guards/jwtAuth.guard';
import { GeulroquisUrlResDto } from '../../../essay/geulroquis/dto/response/geulroquisUrlRes.dto';
import { HomeService } from '../core/home.service';
import { ItemsResDto } from '../dto/response/itemsRes.dto';
import { ThemesResDto } from '../dto/response/themesRes.dto';

@ApiTags('Home-query')
@Controller('home')
@UseGuards(JwtAuthGuard)
export class HomeQueryController {
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
  현재 서비스에서 제공되는 모든 테마를 조회하고, 사용자가 이미 소유한 테마인지 여부를 확인합니다.
  이 API는 사용자에게 제공되는 테마와 그 소유 상태를 한 번에 파악할 수 있는 기능을 제공합니다.
    
  **동작 과정:**
  1. 사용자가 테마를 처음 조회할 때 기본 테마인 'Workaholic' 테마가 자동으로 부여됩니다.
  2. 사용자에게 할당된 모든 테마를 데이터베이스에서 조회합니다.
  3. 서비스에서 제공 중인 전체 테마 목록을 조회합니다.
  4. 조회된 테마 목록을 사용자가 소유한 테마와 비교하여 각 테마의 소유 여부를 판단합니다.
  5. 사용자가 소유한 테마와 소유하지 않은 테마 정보를 함께 포함한 리스트를 클라이언트에게 반환합니다.
  `,
  })
  @ApiResponse({ status: 200, type: ThemesResDto })
  async getThemes(@Req() req: ExpressRequest) {
    return this.homeService.getThemes(req.user.id);
  }

  @Get('items')
  @ApiOperation({
    summary: '아이템 조회',
    description: `
  사용자가 선택한 테마와 포지션에 따라 아이템 목록을 조회하고, 각 아이템이 사용자가 소유한 것인지 여부를 확인합니다.

  **쿼리 파라미터:**
  - \`themeId\`: 조회할 아이템들의 테마
  - \`position\`: 조회할 아이템들의 포지션 

  **동작 과정:**
  1. 클라이언트에서 선택한 테마 ID와 포지션을 기준으로 아이템을 조회합니다.
  2. 해당 테마와 포지션에 해당하는 아이템 목록을 캐시에서 조회합니다.
  3. 캐시된 데이터가 없으면 데이터베이스에서 아이템을 조회하고, 그 결과를 캐시합니다.
  4. 사용자가 이미 소유한 아이템 목록을 데이터베이스에서 조회합니다.
  5. 모든 아이템에 대해 사용자가 소유한 여부를 판별하고, 소유 여부 정보를 아이템 리스트에 추가합니다.
  6. 사용자에게 테마와 포지션에 따른 아이템 리스트를 소유 여부와 함께 반환합니다.

  이 API는 특정 테마와 위치에서 사용 가능한 아이템 목록과 그 소유 상태를 조회하는 데 유용합니다.
  `,
  })
  @ApiResponse({ status: 200, type: ItemsResDto })
  async getItems(
    @Req() req: ExpressRequest,
    @Query('themeId') themeId: number,
    @Query('position') position: string,
  ) {
    return this.homeService.getItems(req.user.id, themeId, position);
  }
}
