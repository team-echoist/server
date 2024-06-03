import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { OptionalParseIntPipe } from '../../common/pipes/optionalParseInt.pipe';
import { DashboardResDto } from './dto/response/dashboardRes.dto';
import { ReportsSchemaDto } from './dto/schema/reportsSchema.dto';
import { ProcessReqDto } from './dto/request/processReq.dto';
import { ReviewsSchemaDto } from './dto/schema/reviewsSchema.dto';
import { ReportDetailResDto } from './dto/response/reportDetailRes.dto';
import { HistoriesResDto } from './dto/response/historiesRes.dto';
import { UserDetailResDto } from './dto/response/userDetailRes.dto';
import { UsersResDto } from './dto/response/usersRes.dto';
import { UpdateFullUserReqDto } from './dto/request/updateFullUserReq.dto';
import { CreateAdminReqDto } from './dto/request/createAdminReq.dto';
import { EssaysSchemaDto } from './dto/schema/essaysSchema.dto';
import { FullEssayResDto } from './dto/response/fullEssayRes.dto';
import { UpdateEssayStatusReqDto } from './dto/request/updateEssayStatusReq.dto';
import { AdminLoginReqDto } from './dto/request/adminLoginReq.dto';
import { AdminsSchemaDto } from './dto/schema/adminsSchema.dto';
import { OptionalBoolPipe } from '../../common/pipes/optionalBool.pipe';
import { AdminUpdateReqDto } from './dto/request/adminUpdateReq.dto';
import { ProfileImageUrlResDto } from '../user/dto/response/profileImageUrlRes.dto';
import { ProfileImageReqDto } from '../user/dto/request/profileImageReq.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminResDto } from './dto/response/adminRes.dto';
import { SavedAdminResDto } from './dto/response/savedAdminRes.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @UseGuards(AuthGuard('admin-local'))
  @ApiOperation({ summary: '어드민 로그인' })
  @ApiBody({ type: AdminLoginReqDto })
  async adminLogin() {
    return;
  }

  @Put()
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '어드민 본인 정보 수정' })
  @ApiResponse({ type: AdminResDto })
  @ApiBody({ type: AdminUpdateReqDto })
  async updateAdmin(@Req() req: ExpressRequest, @Body() data: AdminUpdateReqDto) {
    return this.adminService.updateAdmin(req.user.id, data);
  }

  @Post('images')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '어드민 프로필 이미지 업로드' })
  @ApiResponse({ type: ProfileImageUrlResDto })
  @ApiBody({ type: ProfileImageReqDto })
  @UseInterceptors(FileInterceptor('image'))
  async saveProfileImage(@Req() req: ExpressRequest, @UploadedFile() file: Express.Multer.File) {
    return this.adminService.saveProfileImage(req.user.id, file);
  }

  @Delete('images')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '어드민 프로필 이미지 삭제' })
  @ApiResponse({ status: 200 })
  async deleteProfileImage(@Req() req: ExpressRequest) {
    return this.adminService.deleteProfileImage(req.user.id);
  }

  @Get()
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '어드민 리스트' })
  @ApiResponse({ status: 200, type: AdminsSchemaDto })
  @ApiQuery({ name: 'active', required: false })
  async getAdmins(@Query('active', OptionalBoolPipe) active?: boolean) {
    return this.adminService.getAdmins(active);
  }

  @Post('produce')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[루트 관리자용] 관리자생성' })
  @ApiBody({ type: CreateAdminReqDto })
  @ApiResponse({ status: 200, type: SavedAdminResDto })
  async createAdmin(@Req() req: ExpressRequest, @Body() data: CreateAdminReqDto) {
    return this.adminService.createAdmin(req.user.id, data);
  }

  @Get('dashboard')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '[관리자용] Dashboard',
    description:
      '총 가입자, 프리미엄 구독자, 오늘 가입자, 오늘자 에세이, 총 에세이, 발행된 에세이, 링크드아웃된 에세이, 처리되지않은 리포트, 처리되지 않은 리뷰',
  })
  @ApiResponse({ status: 200, type: DashboardResDto })
  async dashboard(@Req() req: ExpressRequest) {
    return this.adminService.dashboard();
  }

  @Get('statistics/essays/daily')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '[관리자용] 월간 일별 에세이 작성 카운트',
  })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiResponse({
    status: 200,
    description: 'key = month(1~12), year(4자리)',
    schema: {
      type: 'object',
      example: { '1': 126, '2': 89, '31': 150 },
    },
  })
  async getDailyEssayCount(
    @Query('year', OptionalParseIntPipe) year?: number,
    @Query('month', OptionalParseIntPipe) month?: number,
  ) {
    return this.adminService.countEssaysByDailyThisMonth(year, month);
  }

  @Get('statistics/essays/monthly')
  @UseGuards(AuthGuard('admin-jwt'))
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
    return this.adminService.countEssaysByMonthlyThisYear(year);
  }

  @Get('statistics/users/daily')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 월간 일별 유저 유입 통계' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiResponse({
    status: 200,
    description: 'key = month(1~12), year(4자리)',
    schema: {
      type: 'object',
      example: { '1': 126, '2': 89, '31': 150 },
    },
  })
  async getDailyRegistrations(
    @Query('year', OptionalParseIntPipe) year?: number,
    @Query('month', OptionalParseIntPipe) month?: number,
  ) {
    return this.adminService.countDailyRegistrations(year, month);
  }

  @Get('statistics/users/monthly')
  @UseGuards(AuthGuard('admin-jwt'))
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
    return this.adminService.countMonthlyRegistrations(year);
  }

  @Get('statistics/payments/daily')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 월간 일별 구독 가입 통계' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiResponse({
    status: 200,
    description: 'key = month(1~12), year(4자리)',
    schema: {
      type: 'object',
      example: { '1': 126, '2': 89, '31': 150 },
    },
  })
  async getDailySubscriptionPayments(
    @Query('year', OptionalParseIntPipe) year?: number,
    @Query('month', OptionalParseIntPipe) month?: number,
  ) {
    return this.adminService.countMonthlySubscriptionPayments(year, month);
  }

  @Get('statistics/payments/monthly')
  @UseGuards(AuthGuard('admin-jwt'))
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
    return this.adminService.countYearlySubscriptionPayments(year);
  }

  @Get('reports')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '[관리자용] 리포트 리스트',
    description: '확인되지 않은 신고 중 신고 수가 많은 순으로 정렬',
  })
  @ApiResponse({ status: 200, type: ReportsSchemaDto })
  @ApiQuery({ name: 'sort', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReports(
    @Query('sort') sort: string,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.adminService.getReports(sort, page, limit);
  }

  @Get('reports/:essayId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 리포트 상세 조회' })
  @ApiResponse({ status: 200, type: ReportDetailResDto })
  async getEssayReports(@Param('essayId', ParseIntPipe) essayId: number) {
    return this.adminService.getReportDetails(essayId);
  }

  @Post('reports/:essayId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 리포트 처리' })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: ProcessReqDto })
  async processReports(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Body() processReqDto: ProcessReqDto,
  ) {
    return this.adminService.processReports(req.user.id, essayId, processReqDto);
  }

  @Get('reviews')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 리뷰 리스트' })
  @ApiResponse({ status: 200, type: ReviewsSchemaDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReviews(
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.adminService.getReviews(page, limit);
  }

  @Get('reviews/:reviewId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 리뷰 상세' })
  @ApiResponse({ status: 200 })
  async getReview(@Param('reviewId', ParseIntPipe) reviewId: number) {
    return this.adminService.detailReview(reviewId);
  }

  @Post('review/:reviewId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 리뷰 처리' })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: ProcessReqDto })
  async processReview(
    @Req() req: ExpressRequest,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() processReqDto: ProcessReqDto,
  ) {
    return this.adminService.processReview(req.user.id, reviewId, processReqDto);
  }

  @Get('users')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 유저 리스트 조회' })
  @ApiResponse({ status: 200, type: UsersResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'filter', enum: ['all', 'monitored', 'activeSubscription'], required: false })
  async getUsers(
    @Query('page', new PagingParseIntPipe(1)) page?: number,
    @Query('limit', new PagingParseIntPipe(10)) limit?: number,
    @Query('filter') filter?: string,
  ) {
    return this.adminService.getUsers(filter, page, limit);
  }

  @Get('users/:userId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 유저 상세 조회' })
  @ApiResponse({ status: 200, type: UserDetailResDto })
  async getUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.getUser(userId);
  }

  @Put('users/:userId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '[관리자용] 유저 정보 수정',
    description: 'userStatus를 banned로 요청시 사용자 에세이 논리삭제 및 계정 정지',
  })
  @ApiResponse({ status: 200, type: UserDetailResDto })
  @ApiBody({ type: UpdateFullUserReqDto })
  async updateUser(
    @Req() req: ExpressRequest,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() data: UpdateFullUserReqDto,
  ) {
    return this.adminService.updateUser(req.user.id, userId, data);
  }

  @Get('essays')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 에세이 리스트 조회' })
  @ApiResponse({ status: 200, type: EssaysSchemaDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getEssays(
    @Query('page', new PagingParseIntPipe(1)) page?: number,
    @Query('limit', new PagingParseIntPipe(10)) limit?: number,
  ) {
    return this.adminService.getFullEssays(page, limit);
  }

  @Get('essays/:essayId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[관리자용] 에세이 상세 데이터 조회' })
  @ApiResponse({ status: 200, type: FullEssayResDto })
  async getEssay(@Param('essayId', ParseIntPipe) essayId: number) {
    return this.adminService.getFullEssay(essayId);
  }

  @Put('essays/:essayId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '[관리자용] 에세이 상태 수정',
    description:
      '발행 및 링크드아웃 취소용. 타겟 에세이에 포함된 리포트 및 리뷰 일괄 처리(보류로 변경)',
  })
  @ApiResponse({ status: 200, type: FullEssayResDto })
  @ApiBody({ type: UpdateEssayStatusReqDto })
  async updateEssayStatus(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Body() data: UpdateEssayStatusReqDto,
  ) {
    return this.adminService.updateEssayStatus(req.user.id, essayId, data);
  }

  @Get('histories')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '[관리자용] 관리자 처리 기록',
    description:
      '[target] = report | review | essay | user, [action] = approved | rejected | pending | unpublished | unlinkedout | deleted',
  })
  @ApiResponse({ status: 200, type: HistoriesResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'target', required: false })
  @ApiQuery({ name: 'action', required: false })
  async getHistories(
    @Query('page', new PagingParseIntPipe(1)) page?: number,
    @Query('limit', new PagingParseIntPipe(10)) limit?: number,
    @Query('target') target?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getHistories(page, limit, target, action);
  }

  @Get(':adminId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '어드민 상세조회' })
  @ApiResponse({ status: 200, type: AdminResDto })
  async getAdmin(@Param('adminId', ParseIntPipe) adminId: number) {
    return this.adminService.getAdmin(adminId);
  }

  @Put(':adminId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({ summary: '[루트관리자용] 어드민 활성화 상태 변경' })
  @ApiResponse({ status: 200, type: AdminResDto })
  @ApiQuery({ name: 'active', required: true })
  async activationSettings(
    @Param('adminId', ParseIntPipe) adminId: number,
    @Query('active', ParseBoolPipe) active: boolean,
  ) {
    return this.adminService.activationSettings(adminId, active);
  }
}
