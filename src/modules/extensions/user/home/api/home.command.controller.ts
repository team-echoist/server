import { Controller, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../../../../../common/guards/jwtAuth.guard';
import {
  BuyThemeCommand,
  ChangeThemeCommand,
  BuyItemCommand,
  ActivateItemCommand,
} from '../command';

@ApiTags('Home-command')
@Controller('home')
@UseGuards(JwtAuthGuard)
export class HomeCommandController {
  constructor(private readonly commandBus: CommandBus) {}

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
  
  **주의 사항:**
  - 서버에서 트랜잭션 관리를 하겠지만, 클라이언트 측에서도 구매요청 시 충돌방지를 위해 통신이 끝나기까지 다른 조작이 불가능하도록 하면 좋을 것 같습니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async buyTheme(@Req() req: ExpressRequest, @Param('themeId', ParseIntPipe) themeId: number) {
    return this.commandBus.execute(new BuyThemeCommand(req.user.id, themeId));
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
    return this.commandBus.execute(new ChangeThemeCommand(req.user.id, themeId));
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
  
  **주의 사항:**
  - 서버에서 트랜잭션 관리를 하겠지만, 클라이언트 측에서도 구매요청 시 충돌방지를 위해 통신이 끝나기까지 다른 조작이 불가능하도록 하면 좋을 것 같습니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async buyItem(@Req() req: ExpressRequest, @Param('itemId', ParseIntPipe) itemId: number) {
    return this.commandBus.execute(new BuyItemCommand(req.user.id, itemId));
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
    return this.commandBus.execute(new ActivateItemCommand(req.user.id, itemId));
  }
}
