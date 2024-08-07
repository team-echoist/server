import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { SupportService } from './support.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { NoticeResDto } from './dto/response/noticeRes.dto';
import { NoticesSummaryResDto } from './dto/response/noticesSummaryRes.dto';
import { InquiryReqDto } from './dto/request/inquiryReq.dto';
import { InquirySummaryResDto } from './dto/response/inquirySummaryRes.dto';
import { UpdatedHistoriesResDto } from './dto/response/updatedHistoriesRes.dto';
import { UpdateAlertSettingsReqDto } from './dto/request/updateAlertSettings.dto';
import { AlertSettingsResDto } from './dto/response/alertSettingsRes.dto';
import { RegisterDeviceReqDto } from './dto/request/registerDeviceReq.dto';
import { InquiryResDto } from './dto/response/inquiryRes.dto';
import { VersionsSummaryResDto } from './dto/response/versionsSummaryRes.dto';

@ApiTags('Support')
@UseGuards(AuthGuard('jwt'))
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('notices')
  @ApiOperation({
    summary: '공지사항 목록 조회',
    description: `
  공지사항 목록을 페이지네이션하여 조회합니다. 페이지와 페이지당 항목 수를 파라미터로 받습니다.

  **쿼리 파라미터:**
  - \`page\` (number, optional): 페이지 번호 (기본값: 1)
  - \`limit\` (number, optional): 페이지당 항목 수 (기본값: 10)
  `,
  })
  @ApiResponse({ status: 200, type: NoticesSummaryResDto })
  async getNotices(
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.supportService.getNotices(page, limit);
  }

  @Get('notices/:noticeId')
  @ApiOperation({
    summary: '공지사항 상세 조회',
    description: `
  특정 공지사항의 상세 정보를 조회합니다.

  **경로 파라미터:**
  - \`noticeId\` (number, required): 조회할 공지사항의 ID
  `,
  })
  @ApiResponse({ status: 200, type: NoticeResDto })
  async getNotice(@Param('noticeId', ParseIntPipe) noticeId: number) {
    return this.supportService.getNotice(noticeId);
  }

  @Post('inquiries')
  @ApiOperation({
    summary: '고객 문의 작성',
    description: `
  사용자가 고객 문의를 작성합니다.
  
  **요청 본문:**
  - \`title\`: 문의 제목
  - \`content\`: 문의 내용
  - \`type\`: 문의 유형
  
  **동작 과정:**
  1. 사용자가 문의 제목, 내용, 유형을 작성합니다.
  2. 서버는 문의를 저장하고, 저장된 문의 정보를 반환합니다.
  
  **주의 사항:**
  - 제목과 내용은 비워둘 수 없습니다.
  `,
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: InquiryReqDto })
  async createInquiry(@Req() req: ExpressRequest, @Body() data: InquiryReqDto) {
    return this.supportService.createInquiry(req.user.id, data);
  }

  @Get('inquiries')
  @ApiOperation({
    summary: '고객 문의 목록 조회',
    description: `
  사용자가 작성한 모든 고객 문의를 조회합니다.
  
  **동작 과정:**
  1. 사용자가 작성한 모든 문의를 조회합니다.
  2. 조회된 문의 목록을 반환합니다.
  
  `,
  })
  @ApiResponse({ status: 200, type: InquirySummaryResDto })
  async getInquiries(@Req() req: ExpressRequest) {
    return this.supportService.getInquiries(req.user.id);
  }

  @Get('inquiries/:inquiryId')
  @ApiOperation({
    summary: '고객 문의 상세 조회',
    description: `
  사용자가 작성한 문의를 상세 조회합니다.
  
  **동작 과정:**
  1. 사용자가 문의를 조회합니다.
  2. 조회된 문의의 상세 정보 및 답변을 반환합니다.
  
  `,
  })
  @ApiResponse({ status: 200, type: InquiryResDto })
  async getInquiry(
    @Req() req: ExpressRequest,
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
  ) {
    return this.supportService.getInquiry(req.user.id, inquiryId);
  }

  @Get('updated-histories')
  @ApiOperation({
    summary: '전체 업데이트 히스토리 조회 (유저용)',
    description: `
  유저가 모든 업데이트 히스토리를 조회합니다.

  **쿼리 파라미터:**
  - \`page\`: 페이지 번호 (기본값: 1)
  - \`limit\`: 페이지당 항목 수 (기본값: 10)

  **동작 과정:**
  1. 모든 업데이트 히스토리를 페이지네이션하여 조회합니다.
  2. 작성자 정보를 제외한 업데이트 히스토리 목록을 반환합니다.

  **주의 사항:**
  - 유저 권한으로 접근할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200, type: UpdatedHistoriesResDto })
  async getUserUpdateHistories(
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.supportService.getUserUpdateHistories(page, limit);
  }

  @Get('settings/:deviceId')
  @ApiOperation({
    summary: '사용자의 알림 설정 조회',
    description: `
  사용자가 자신의 알림 설정을 조회합니다.
  
  **경로 파라미터:**
  - \`deviceId\` (string, required): 조회할 디바이스의 고유 ID

  **동작 과정:**
  1. 현재 로그인된 사용자의 알림 설정을 조회합니다.
  2. 알림 설정이 없는 경우 기본 값을 생성하여 반환합니다.

  **주의 사항:**
  - 사용자는 인증이 필요합니다.
  `,
  })
  @ApiResponse({ status: 200, type: AlertSettingsResDto })
  async getSettings(@Req() req: ExpressRequest, @Param('deviceId') deviceId: string) {
    return this.supportService.getSettings(req.user.id, deviceId);
  }

  @Post('settings/:deviceId')
  @ApiOperation({
    summary: '사용자의 알림 설정 업데이트',
    description: `
  사용자가 자신의 알림 설정을 업데이트합니다.

  **경로 파라미터:**
  - \`deviceId\` (string, required): 업데이트할 디바이스의 고유 ID

  **요청 본문:**
  - \`viewed\`: 발행 또는 링크드아웃 한 글 최초 조회 알림 (boolean)
  - \`report\`: 신고 완료 알림 (boolean)
  - \`marketing\`: 광고성 마케팅 알림 (boolean)

  **동작 과정:**
  1. 현재 로그인된 사용자의 알림 설정을 업데이트합니다.
  2. 설정이 없으면 새로 생성하여 저장합니다.

  **주의 사항:**
  - 사용자는 인증이 필요합니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: UpdateAlertSettingsReqDto })
  async updateSettings(
    @Req() req: ExpressRequest,
    @Param('deviceId') deviceId: string,
    @Body() data: UpdateAlertSettingsReqDto,
  ) {
    return this.supportService.updateSettings(req.user.id, data, deviceId);
  }

  @Post('devices/register')
  @ApiOperation({
    summary: '디바이스 등록',
    description: `
  사용자의 디바이스를 등록합니다. 

  **요청 본문:**
  - \`deviceId\` (string, required): 디바이스 고유 식별자
  - \`deviceToken\` (string, required): FCM에서 발급한 디바이스 토큰

  **동작 과정:**
  1. 클라이언트에서 디바이스 고유 식별자와 FCM 디바이스 토큰을 서버로 전송합니다.
  2. 서버는 해당 정보를 데이터베이스에 저장합니다.
  3. 이미 등록된 디바이스의 경우, 토큰을 업데이트합니다.

  **주의 사항:**
  - 사용자는 인증이 필요합니다.
  `,
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: RegisterDeviceReqDto })
  async registerDevice(@Req() req: ExpressRequest, @Body() body: RegisterDeviceReqDto) {
    return this.supportService.registerDevice(req, body.deviceId, body.deviceToken);
  }

  @Get('versions')
  @ApiOperation({
    summary: '앱 버전 조회',
    description: `
  각 앱들의 현재 최신 버전을 조회합니다.
  
  **앱 타입:**
  - \`android_mobile\`
  - \`android_tablet\`
  - \`ios_mobile\`
  - \`ios_tablet\`
  - \`desktop_mac\`
  - \`desktop_windows\`
  `,
  })
  @ApiResponse({ status: 200, type: VersionsSummaryResDto })
  async getVersions() {
    return this.supportService.getVersions();
  }
}
