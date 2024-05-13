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
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { OptionalParseIntPipe } from '../../common/pipes/optionalParseInt.pipe';
import { DashboardResDto } from './dto/response/dashboardRes.dto';
import { ReportsResDto } from './dto/response/reportsRes.dto';
import { ProcessReqDto } from './dto/request/processReq.dto';
import { ReviewsResDto } from './dto/response/reviewsRes.dto';
import { ReportDetailResDto } from './dto/response/reportDetailRes.dto';
import { HistoriesResDto } from './dto/response/historiesRes.dto';

@ApiTags('Admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: '[관리자용] Dashboard',
    description:
      '총 가입자, 프리미엄 구독자, 오늘 가입자, 오늘자 에세이, 총 에세이, 발행된 에세이, 링크드아웃된 에세이, 처리되지않은 리포트, 처리되지 않은 리뷰',
  })
  @ApiResponse({ status: 200, type: DashboardResDto })
  async dashboard() {
    return await this.adminService.dashboard();
  }

  @Get('statistics/essay/daily')
  @ApiOperation({
    summary: '[관리자용] 월간 일별 에세이 작성 카운트',
  })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiResponse({
    status: 200,
    description: 'key = 일(1~31)',
    schema: {
      type: 'object',
      example: { '1': 126, '2': 89, '31': 150 },
    },
  })
  async getDailyEssayCount(
    @Query('year', OptionalParseIntPipe) year?: number,
    @Query('month', OptionalParseIntPipe) month?: number,
  ) {
    const a = await this.adminService.countEssaysByDailyThisMonth(year, month);
    console.log(a);
  }

  @Get('statistics/essay/month')
  @ApiOperation({
    summary: '[관리자용] 년간 월별 에세이 작성 카운트',
  })
  @ApiQuery({ name: 'year', required: false })
  @ApiResponse({
    status: 200,
    description: 'key = 월(1~12)',
    schema: {
      type: 'object',
      example: { '1': 542, '2': 753, '12': '347' },
    },
  })
  async getMonthlyEssayCount(@Query('year', OptionalParseIntPipe) year?: number) {
    return await this.adminService.countEssaysByMonthlyThisYear(year);
  }

  @Get('statistics/user/daily')
  @ApiOperation({ summary: '[관리자용] 월간 일별 유저 유입 통계' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiResponse({
    status: 200,
    description: 'key = 일(1~31)',
    schema: {
      type: 'object',
      example: { '1': 126, '2': 89, '31': 150 },
    },
  })
  async getDailyRegistrations(
    @Query('year', OptionalParseIntPipe) year?: number,
    @Query('month', OptionalParseIntPipe) month?: number,
  ) {
    return await this.adminService.countDailyRegistrations(year, month);
  }

  @Get('statistics/user/month')
  @ApiOperation({ summary: '[관리자용] 년간 월별 유저 유입 통계' })
  @ApiQuery({ name: 'year', required: false })
  @ApiResponse({
    status: 200,
    description: 'key = 월(1~12)',
    schema: {
      type: 'object',
      example: { '1': 542, '2': 753, '12': '347' },
    },
  })
  async getMonthlyRegistrations(@Query('year', OptionalParseIntPipe) year?: number) {
    return await this.adminService.countMonthlyRegistrations(year);
  }

  @Get('statistics/payment/daily')
  @ApiOperation({ summary: '[관리자용] 월간 일별 구독 가입 통계' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiResponse({
    status: 200,
    description: 'key = 일(1~31)',
    schema: {
      type: 'object',
      example: { '1': 126, '2': 89, '31': 150 },
    },
  })
  async getDailySubscriptionPayments(
    @Query('year', OptionalParseIntPipe) year?: number,
    @Query('month', OptionalParseIntPipe) month?: number,
  ) {
    return await this.adminService.countMonthlySubscriptionPayments(year, month);
  }

  @Get('statistics/payment/month')
  @ApiOperation({ summary: '[관리자용] 년간 월별 구독 가입 통계' })
  @ApiQuery({ name: 'year', required: false })
  @ApiResponse({
    status: 200,
    description: 'key = 월(1~12)',
    schema: {
      type: 'object',
      example: { '1': 542, '2': 753, '12': '347' },
    },
  })
  async getMonthlySubscriptionPayments(@Query('year', OptionalParseIntPipe) year?: number) {
    return await this.adminService.countYearlySubscriptionPayments(year);
  }

  @Get('report')
  @ApiOperation({
    summary: '[관리자용] 리포트 리스트',
    description: '확인되지 않은 신고 중 신고 수가 많은 순으로 정렬',
  })
  @ApiResponse({ status: 200, type: ReportsResDto })
  @ApiQuery({ name: 'sort', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReports(
    @Query('sort') sort: string,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return await this.adminService.getReports(sort, page, limit);
  }

  @Get('report/:essayId')
  @ApiOperation({ summary: '[관리자용] 리포트 상세 조회' })
  @ApiResponse({ status: 200, type: ReportDetailResDto })
  async getEssayReports(@Param('essayId', ParseIntPipe) essayId: number) {
    return await this.adminService.getReportDetails(essayId);
  }

  @Post('report/:essayId')
  @ApiOperation({ summary: '[관리자용] 리포트 처리' })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: ProcessReqDto })
  async processReports(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Body() processReqDto: ProcessReqDto,
  ) {
    return await this.adminService.processReports(req.user.id, essayId, processReqDto);
  }

  @Get('reviews')
  @ApiOperation({ summary: '[관리자용] 리뷰 리스트' })
  @ApiResponse({ status: 200, type: ReviewsResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReviews(
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return await this.adminService.getReviews(page, limit);
  }

  @Get('review/:reviewId')
  @ApiOperation({ summary: '[관리자용] 리뷰 상세' })
  @ApiResponse({ status: 200 })
  async getReview(@Param('reviewId', ParseIntPipe) reviewId: number) {
    return await this.adminService.detailReview(reviewId);
  }

  @Post('review/:reviewId')
  @ApiOperation({ summary: '[관리자용] 리뷰 처리' })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: ProcessReqDto })
  async processReview(
    @Req() req: ExpressRequest,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() processReqDto: ProcessReqDto,
  ) {
    return await this.adminService.processReview(req.user.id, reviewId, processReqDto);
  }

  @Get('history')
  @ApiOperation({ summary: '[관리자용] 리포트 및 리뷰 관리자 처리 기록' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: HistoriesResDto })
  async getHistories(
    @Query('page', new PagingParseIntPipe(1)) page?: number,
    @Query('limit', new PagingParseIntPipe(10)) limit?: number,
  ) {
    return await this.adminService.getHistories(page, limit);
  }

  @Get('users')
  @ApiOperation({ summary: '[관리자용] 유저 리스트 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'filter', enum: ['all', 'banned', 'activeSubscription'], required: false })
  @ApiResponse({ status: 200 })
  async getUsers(
    @Query('page', new PagingParseIntPipe(1)) page?: number,
    @Query('limit', new PagingParseIntPipe(10)) limit?: number,
    @Query('filter') filter?: string,
  ) {
    return await this.adminService.getUsers(filter, page, limit);
  }
}
