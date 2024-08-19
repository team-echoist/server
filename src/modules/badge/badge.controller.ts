import { Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BadgeService } from './badge.service';
import { Request as ExpressRequest } from 'express';
import { BadgesResDto } from './dto/response/badgesRes.dto';
import { BadgesWithTagsResDto } from './dto/response/badgesWithTagsRes.dto';
import { JwtAuthGuard } from '../../common/guards/jwtAuth.guard';

@ApiTags('Badge')
@Controller('badges')
@UseGuards(JwtAuthGuard)
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Post('level/:badgeId')
  @ApiOperation({
    summary: '뱃지 레벨업',
    description: `
  사용자가 소유한 특정 뱃지의 레벨을 올립니다. 뱃지를 레벨업하기 위해서는 해당 뱃지에 필요한 경험치가 충분해야 합니다.

  **경로 파라미터:**
  - \`badgeId\`: 레벨업할 뱃지의 고유 ID

  **동작 과정:**
  1. 사용자의 ID와 레벨업할 뱃지의 ID를 받아 뱃지를 조회합니다.
  2. 해당 뱃지가 사용자가 소유한 뱃지인지 확인합니다.
  3. 뱃지의 경험치가 레벨업에 충분한지 확인합니다.
  4. 경험치가 충분하지 않으면 예외를 던집니다.
  5. 뱃지의 레벨을 올리고 경험치를 차감합니다.
  6. 업데이트된 뱃지 정보를 데이터베이스에 저장합니다.

  **주의 사항:**
  - 뱃지를 레벨업하기 위해서는 최소한 10의 경험치가 필요합니다.
  - 사용자가 소유하지 않은 뱃지를 레벨업하려고 하면 예외가 발생합니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async levelUpBadge(@Req() req: ExpressRequest, @Param('badgeId', ParseIntPipe) badgeId: number) {
    return this.badgeService.levelUpBadge(req.user.id, badgeId);
  }

  @Get()
  @ApiOperation({
    summary: '획득한 뱃지 리스트',
    description: `
  사용자가 획득한 모든 뱃지 목록을 조회합니다.

  **동작 과정:**
  1. 사용자의 ID를 기반으로 해당 사용자가 획득한 모든 뱃지를 조회합니다.
  2. 조회된 뱃지 목록을 반환합니다.

  **주의 사항:**
  - 사용자가 아직 획득하지 않은 뱃지도 기본 정보와 함께 반환됩니다.
  `,
  })
  @ApiResponse({ status: 200, type: BadgesResDto })
  async userBadges(@Req() req: ExpressRequest) {
    return this.badgeService.getBadges(req.user.id);
  }

  @Get('detail')
  @ApiOperation({
    summary: '획득한 뱃지 상세 리스트',
    description: `
  사용자가 획득한 모든 뱃지와 해당 뱃지와 연관된 태그 목록을 조회합니다.

  **동작 과정:**
  1. 사용자의 ID를 기반으로 해당 사용자가 획득한 모든 뱃지와 연관된 태그를 조회합니다.
  2. 조회된 뱃지와 태그 목록을 반환합니다.
  3. 사용자가 아직 획득하지 않은 뱃지도 기본 정보와 함께 반환됩니다.

  **주의 사항:**
  - 사용자가 아직 획득하지 않은 뱃지도 기본 정보와 함께 반환됩니다.
  - 각 뱃지에는 연관된 태그 목록이 포함됩니다.
  `,
  })
  @ApiResponse({ status: 200, type: BadgesWithTagsResDto })
  async userBadgesWithTags(@Req() req: ExpressRequest) {
    return this.badgeService.getBadgeWithTags(req.user.id);
  }
}
