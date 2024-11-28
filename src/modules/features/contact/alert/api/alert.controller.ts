import { Controller, Get, Param, ParseIntPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AlertService } from '../core/alert.service';
import { Request as ExpressRequest } from 'express';
import { AlertsResDto } from '../dto/response/alertsRes.dto';
import { PagingParseIntPipe } from '../../../../../common/pipes/pagingParseInt.pipe';
import { JwtAuthGuard } from '../../../../../common/guards/jwtAuth.guard';

@Controller('alerts')
@ApiTags('Alert')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get('unread')
  @ApiOperation({
    summary: '새로운 알림 확인',
    description: `
  사용자가 안 읽은 알림이 있는지 확인합니다.

  **동작 과정:**
  1. 현재 로그인된 사용자의 안 읽은 알림이 있는지 확인합니다.
  2. 안 읽은 알림이 있으면 \`true\`, 없으면 \`false\`를 반환합니다.

  **주의 사항:**
  - 사용자는 인증이 필요합니다.
  `,
  })
  @ApiResponse({ status: 200, type: Boolean })
  async hasUnreadAlerts(@Req() req: ExpressRequest) {
    return this.alertService.hasUnreadAlerts(req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: '알림 목록 조회',
    description: `
  사용자의 알림 목록을 조회합니다.
  
  **쿼리 파라미터:**
  - \`page\`: 페이지 번호 (기본값: 1)
  - \`limit\`: 한 페이지에 보여줄 에세이 수 (기본값: 10)

  **동작 과정:**
  1. 현재 로그인된 사용자의 알림 목록을 조회합니다.

  **주의 사항:**
  - 사용자는 인증이 필요합니다.
  `,
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: AlertsResDto })
  async getAlerts(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.alertService.getAlerts(req.user.id, page, limit);
  }

  @Patch('read/:alertId')
  @ApiOperation({
    summary: '알림 읽음 처리',
    description: `
  특정 알림을 읽음 처리합니다.
  
  **경로 파라미터:**
  - \`alertId\` (number, required): 읽음 처리할 알림의 ID

  **동작 과정:**
  1. 해당 알림을 읽음 처리합니다.

  **주의 사항:**
  - 사용자는 인증이 필요합니다.
  `,
  })
  @ApiResponse({ status: 204, description: '알림이 성공적으로 읽음 처리되었습니다.' })
  async markAlertAsRead(
    @Req() req: ExpressRequest,
    @Param('alertId', ParseIntPipe) alertId: number,
  ) {
    await this.alertService.markAlertAsRead(req.user.id, alertId);
  }
}
