import { Controller, Get, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwtAuth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BurialService } from './burial.service';
import { Request as ExpressRequest } from 'express';
import { SummaryEssayResDto } from '../../../base/essay/dto/response/summaryEssayRes.dto';

@ApiTags('Burial')
@Controller('burials')
@UseGuards(JwtAuthGuard)
export class BurialController {
  constructor(private readonly burialService: BurialService) {}

  @Get('notice')
  @ApiOperation({
    summary: '사용자 주변에 땅에 묻힌 에세이 알림',
    description: `
  사용자가 현재 위치를 기반으로 1km 이내에 본인이 작성한 땅에 묻힌 에세이가 있는지 확인하고, 존재할 경우 푸시 알림을 발송합니다.

  **요청 쿼리:**
  - \`latitude\`: 현재 위치의 위도 
  - \`longitude\`: 현재 위치의 경도

  **동작 과정:**
  1. 사용자의 요청에서 위도와 경도 좌표를 받아 현재 위치를 설정합니다.
  2. 데이터베이스에서 해당 사용자가 작성한 에세이 중 1km 이내에 있는 항목을 조회합니다.
  3. 1km 이내에 에세이가 있는 경우, 에세이 개수를 포함한 푸시 알림을 발송합니다.

  **주의 사항:**
  - 사용자는 인증이 필요하며, JWT 토큰이 요청 헤더에 포함되어야 합니다.
  - 알림은 사용자의 알림 설정에 따라 발송 여부가 결정됩니다.

  **응답:**
  - 200: 알림 발송 여부와 관계없이 요청이 정상적으로 처리됨.
  - 400: 잘못된 좌표 형식이 전달되었거나 좌표가 누락된 경우.
  `,
  })
  @ApiResponse({ status: 200 })
  async notifyIfBurialNearby(
    @Req() req: ExpressRequest,
    @Query('latitude', ParseIntPipe) latitude: number,
    @Query('longitude', ParseIntPipe) longitude: number,
  ) {
    return this.burialService.notifyIfBurialNearby(req.user.id, latitude, longitude);
  }

  @Get()
  @ApiOperation({
    summary: '사용자 주변에 땅에 묻힌 에세이 리스트 조회',
    description: `
  사용자가 현재 위치를 기반으로 1km 이내에 본인이 작성한 땅에 묻힌 에세이 리스트를 조회합니다.

  **요청 쿼리:**
  - \`latitude\`: 현재 위치의 위도 
  - \`longitude\`: 현재 위치의 경도

  **동작 과정:**
  1. 사용자의 요청에서 위도와 경도 좌표를 받아 현재 위치를 설정합니다.
  2. 데이터베이스에서 해당 사용자가 작성한 에세이 중 1km 이내에 있는 항목을 조회합니다.

  **주의 사항:**
  - 사용자는 인증이 필요하며, JWT 토큰이 요청 헤더에 포함되어야 합니다.
  - 알림은 사용자의 알림 설정에 따라 발송 여부가 결정됩니다.

  **응답:**
  // - 200: 알림 발송 여부와 관계없이 요청이 정상적으로 처리됨.
  // - 400: 잘못된 좌표 형식이 전달되었거나 좌표가 누락된 경우.
  `,
  })
  @ApiResponse({ status: 200, type: SummaryEssayResDto })
  async findBurialNearby(
    @Req() req: ExpressRequest,
    @Query('latitude', ParseIntPipe) latitude: number,
    @Query('longitude', ParseIntPipe) longitude: number,
  ) {
    return this.burialService.findBurialNearby(req.user.id, latitude, longitude);
  }
}
