import { Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GeulroquisUrlResDto } from '../geulroquis/dto/response/geulroquisUrlRes.dto';
import { JwtAuthGuard } from '../../common/guards/jwtAuth.guard';
import { Request as ExpressRequest } from 'express';
import { ItemsResDto } from './dto/response/itemsRes.dto';
import { ThemesResDto } from './dto/response/themesRes.dto';

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

  @Post('themes/buy/:themeId')
  @ApiOperation({
    summary: '테마 구매',
    description: `
  사용자가 특정 테마를 구매합니다.

  **경로 파라미터:**
  - \`themeId\`: 구매할 테마 아이디 

  **동작 과정:**
  1. 사용자의 고유 ID와 구매할 테마의 ID를 인자로 받아 처리합니다.
  2. 먼저, 사용자가 이미 해당 테마를 소유하고 있는지 확인합니다.
  3. 만약 이미 소유한 테마라면, '이미 소유한 테마입니다'라는 오류 메시지를 반환합니다.
  4. 소유하지 않은 테마인 경우, 사용자의 재화(gems)를 확인하여 해당 테마를 구매할 수 있는지 검증합니다.
  5. 재화가 충분하지 않다면, '재화가 부족합니다'라는 오류 메시지를 반환합니다.
  6. 재화가 충분한 경우, 테마의 가격만큼 사용자의 재화를 차감하고, 사용자의 테마 목록에 해당 테마를 추가합니다.
  7. 테마 구매가 성공적으로 완료되었음을 클라이언트에게 알립니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async buyTheme(@Req() req: ExpressRequest, @Param('themeId', ParseIntPipe) themeId: number) {
    return this.homeService.buyTheme(req.user.id, themeId);
  }

  @Post('themes/activate/:themeId')
  @ApiOperation({
    summary: '사용자 테마 활성화',
    description: `
  사용자가 소유한 테마 중에서 선택한 테마로 현재 사용 중인 테마를 변경합니다. 
  기존에 사용 중인 테마는 비활성화되고, 선택한 테마의 레이아웃이 활성화됩니다.
  
  **쿼리 파라미터:**
  - \`themeId\`: 변경하려는 테마의 ID

  **동작 과정:**
  1. 클라이언트는 변경하고자 하는 테마의 ID를 서버에 전달합니다.
  2. 서버는 사용자가 해당 테마를 소유하고 있는지 확인합니다.
  3. 사용자가 해당 테마를 소유하고 있다면, 현재 사용 중인 테마 레이아웃을 비활성화하고 선택한 테마의 레이아웃을 활성화합니다.
  4. 변경된 테마 레이아웃을 저장합니다.
  `,
  })
  @ApiResponse({ status: 200 })
  async changeTheme(@Req() req: ExpressRequest, @Param('themeId', ParseIntPipe) themeId: number) {
    return this.homeService.changeTheme(req.user.id, themeId);
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

  @Post('items/buy/:itemId')
  @ApiOperation({
    summary: '아이템 구매',
    description: `
  사용자가 특정 아이템을 구매합니다.

  **동작 과정:**
  1. 사용자의 고유 ID와 구매할 아이템의 ID를 인자로 받아 처리합니다.
  2. 사용자가 이미 해당 아이템을 소유하고 있는지 확인합니다.
  3. 만약 이미 소유한 아이템이라면, '이미 소유한 아이템입니다'라는 오류 메시지를 반환합니다.
  4. 소유하지 않은 아이템인 경우, 사용자의 재화(gems)를 확인하여 해당 아이템을 구매할 수 있는지 검증합니다.
  5. 재화가 충분하지 않다면, '재화가 부족합니다'라는 오류 메시지를 반환합니다.
  6. 재화가 충분한 경우, 아이템의 가격만큼 사용자의 재화를 차감하고, 사용자의 아이템 목록에 해당 아이템을 추가합니다.
  7. 아이템 구매가 성공적으로 완료되었음을 클라이언트에게 알립니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async buyItem(@Req() req: ExpressRequest, @Param('itemId', ParseIntPipe) itemId: number) {
    return this.homeService.buyItem(req.user.id, itemId);
  }

  @Post('items/activate/:itemId')
  @ApiOperation({
    summary: '아이템 활성화',
    description: `
    사용자가 소유한 아이템을 현재 사용 중인 테마의 레이아웃에 활성화합니다.
    
    **동작 과정:**
    1. 클라이언트는 활성화할 아이템의 ID를 서버에 전달합니다.
    2. 서버는 현재 활성화된 테마의 레이아웃을 가져옵니다.
    3. 아이템이 현재 테마에 속해 있는지 확인하고, 사용자가 해당 아이템을 소유하고 있는지 확인합니다.
    4. 동일한 포지션에 이미 활성화된 아이템이 있는 경우, 기존 아이템을 비활성화합니다.
    5. 선택한 아이템을 활성화하여 레이아웃에 등록합니다.
    
    **경로 파라미터:**
    - \`itemId\`: 활성화할 아이템의 ID.
    
    **예외 처리:**
    - \`활성화된 레이아웃이 없습니다.\`: 사용자가 활성화한 테마 레이아웃이 없는 경우 발생.
    - \`해당 아이템이 존재하지 않거나, 현재 테마에 속하지 않습니다.\`: 아이템이 현재 테마에 속하지 않거나 존재하지 않을 경우 발생.
    - \`해당 아이템을 소유하고 있지 않습니다.\`: 사용자가 해당 아이템을 소유하지 않은 경우 발생.
    `,
  })
  async activateItem(@Req() req: ExpressRequest, @Param('itemId', ParseIntPipe) itemId: number) {
    return this.homeService.activateItem(req.user.id, itemId);
  }
}
