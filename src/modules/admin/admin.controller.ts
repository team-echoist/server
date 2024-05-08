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
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { DashboardResDto } from './dto/response/dashboardRes.dto';
import { ReportsResDto } from './dto/response/reportsRes.dto';
import { ProcessReqDto } from './dto/request/processReq.dto';
import { Request as ExpressRequest } from 'express';
import { ReviewsResDto } from './dto/response/reviewsRes.dto';
import { ReportDetailResDto } from './dto/response/reportDetailRes.dto';

@ApiTags('Admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Dashboard',
    description:
      '총 가입자, 프리미엄 구독자, 오늘 가입자, 오늘자 에세이, 총 에세이, 발행된 에세이, 링크드아웃된 에세이, 처리되지않은 리포트, 처리되지 않은 리뷰',
  })
  @ApiResponse({ status: 200, type: DashboardResDto })
  async dashboard() {
    return await this.adminService.dashboard();
  }

  @Get('report')
  @ApiOperation({
    summary: '리포트 리스트',
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
  @ApiOperation({ summary: '리포트 상세 조회' })
  @ApiResponse({ status: 200, type: ReportDetailResDto })
  async getEssayReports(@Param('essayId', ParseIntPipe) essayId: number) {
    return await this.adminService.getReportDetails(essayId);
  }

  @Post('report/:essayId')
  @ApiOperation({ summary: '리포트 처리' })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: ProcessReqDto })
  async processEssayReports(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Body() processReqDto: ProcessReqDto,
  ) {
    return await this.adminService.processReports(req.user.id, essayId, processReqDto);
  }

  @Get('review')
  @ApiOperation({ summary: '리뷰 리스트' })
  @ApiResponse({ status: 200, type: ReviewsResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReviews(
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return await this.adminService.getReviews(page, limit);
  }
}
