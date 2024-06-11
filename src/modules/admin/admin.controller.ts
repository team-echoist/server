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
import { DetailReviewResDto } from './dto/response/detailReviewRes.dto';
import { AdminRegisterReqDto } from './dto/request/adminRegisterReq.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register')
  @ApiOperation({
    summary: '어드민 회원가입',
    description: `
  새로운 어드민 계정을 생성합니다. 회원가입 요청이 성공하면, 루트 관리자 확인 대기 상태가 됩니다.

  **요청 본문:**
  - \`email\`: 어드민 이메일 주소 (필수)
  - \`password\`: 어드민 비밀번호 (필수)
  - \`name\`: 어드민 이름 (필수)

  **동작 과정:**
  1. 요청된 이메일이 이미 사용 중인지 확인합니다.
  2. 중복된 이메일이 없으면, 새로운 어드민 데이터를 생성하고 비활성화 상태로 저장합니다.
  3. 저장 후 루트 관리자의 승인을 기다리는 메시지를 반환합니다.

  **주의 사항:**
  - 요청된 이메일이 이미 존재하는 경우, \`409 Conflict\` 오류가 발생합니다.
  - 새로운 어드민은 기본적으로 비활성화 상태로 생성됩니다.
  `,
  })
  @ApiResponse({ type: '' })
  @ApiBody({ type: AdminRegisterReqDto })
  async register(@Body() data: AdminRegisterReqDto) {
    return this.adminService.register(data);
  }

  @Post('login')
  @UseGuards(AuthGuard('admin-local'))
  @ApiOperation({
    summary: '어드민 로그인',
    description: `
  어드민 로그인을 처리합니다. 요청 본문에 어드민의 이메일과 비밀번호를 포함하여 인증을 시도합니다.

  **주의 사항:**
  - 클라이언트 측 계정과는 별도의 테이블로 관리됩니다.
  `,
  })
  @ApiBody({ type: AdminLoginReqDto })
  async adminLogin() {
    return;
  }

  @Put()
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '어드민 본인 정보 수정',
    description: `
  어드민 본인의 정보를 수정합니다. 이메일, 비밀번호, 기타 정보를 수정할 수 있습니다.
    
  **요청 본문:**
  - \`email\`: 새로운 이메일 (선택적)
  - \`password\`: 새로운 비밀번호 (선택적)
  - \`info\`: 추가 정보 (선택적)
  - \`location\`: 위치 정보 (선택적)

  **동작 과정:**
  1. 어드민 ID를 기반으로 어드민 정보를 조회합니다.
  2. 비밀번호가 포함된 경우 해시 처리합니다.
  3. 어드민 정보를 업데이트하고 결과를 반환합니다.

  **주의 사항:**
  - 비밀번호를 변경할 경우, 해시 처리를 위해 bcrypt를 사용합니다.
  `,
  })
  @ApiResponse({ type: AdminResDto })
  @ApiBody({ type: AdminUpdateReqDto })
  async updateAdmin(@Req() req: ExpressRequest, @Body() data: AdminUpdateReqDto) {
    return this.adminService.updateAdmin(req.user.id, data);
  }

  @Post('images')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '어드민 프로필 이미지 업로드',
    description: `
  어드민 프로필 이미지를 업로드합니다. 요청 본문에 이미지 파일을 포함하여 전송합니다.

  **요청 본문:**
  - \`image\`: 업로드할 이미지 파일 (Multer를 사용하여 업로드)

  **동작 과정:**
  1. 이미지 파일을 받아 S3에 업로드합니다.
  2. 업로드된 이미지의 URL을 반환합니다.

  **주의 사항:**
  - 이미지 파일은 multipart/form-data 형식으로 전송되어야 합니다.
  `,
  })
  @ApiResponse({ type: ProfileImageUrlResDto })
  @ApiBody({ type: ProfileImageReqDto })
  @UseInterceptors(FileInterceptor('image'))
  async saveProfileImage(@Req() req: ExpressRequest, @UploadedFile() file: Express.Multer.File) {
    return this.adminService.saveProfileImage(req.user.id, file);
  }

  @Delete('images')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '어드민 프로필 이미지 삭제',
    description: `
  어드민의 프로필 이미지를 삭제합니다.

  **동작 과정:**
  1. 어드민 ID를 기반으로 프로필 이미지를 조회합니다.
  2. 프로필 이미지가 존재하지 않는 경우, 예외를 던집니다.
  3. 프로필 이미지를 S3에서 삭제합니다.
  4. 어드민 엔티티에서 프로필 이미지 URL을 제거하고 저장합니다.

  **주의 사항:**
  - 프로필 이미지가 존재하지 않는 경우, 404 예외를 반환합니다.
  `,
  })
  @ApiResponse({ status: 200 })
  async deleteProfileImage(@Req() req: ExpressRequest) {
    return this.adminService.deleteProfileImage(req.user.id);
  }

  @Get()
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '어드민 리스트',
    description: `
  활성 상태에 따라 어드민 리스트를 조회합니다. 'active' 쿼리 파라미터를 사용하여 활성 상태를 필터링할 수 있습니다.
    
  **쿼리 파라미터:**
  - \`active\`: 어드민의 활성 상태 (true 또는 false, 선택적)
    
  **동작 과정:**
  1. 선택적 쿼리 파라미터 \`active\`를 기반으로 어드민을 조회합니다.
  2. 조회된 어드민 목록을 DTO로 변환하여 반환합니다.
    
  **주의 사항:**
  - \`active\` 파라미터가 제공되지 않으면 모든 어드민을 조회합니다.
  `,
  })
  @ApiResponse({ status: 200, type: AdminsSchemaDto })
  @ApiQuery({ name: 'active', required: false })
  async getAdmins(@Query('active', OptionalBoolPipe) active?: boolean) {
    return this.adminService.getAdmins(active);
  }

  @Post('produce')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '[루트 관리자용] 관리자생성',
    description: `
  루트 관리자가 새로운 관리자를 생성하는 API입니다. 이 API는 루트 관리자만 호출할 수 있습니다.
    
  **주의 사항:**
  - 루트 관리자만 이 API를 호출할 수 있습니다. 루트 관리자 ID는 1로 고정되어 있습니다.
  - 비밀번호는 저장 전에 해시 처리됩니다.
    
  **동작 과정:**
  1. 요청을 보낸 관리자가 루트 관리자 인지 확인합니다.
  2. 제공된 데이터로 새 관리자를 생성합니다.
  3. 새 관리자의 비밀번호를 해시화합니다.
  4. 새 관리자를 데이터베이스에 저장합니다.
  5. 저장된 관리자 정보를 반환합니다.
  `,
  })
  @ApiBody({ type: CreateAdminReqDto })
  @ApiResponse({ status: 200, type: SavedAdminResDto })
  async createAdmin(@Req() req: ExpressRequest, @Body() data: CreateAdminReqDto) {
    return this.adminService.createAdmin(req.user.id, data);
  }

  @Get('dashboard')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: 'Dashboard',
    description: `
  1. 총 가입자 수를 조회합니다.
  2. 현재 프리미엄 구독자 수를 조회합니다.
  3. 오늘 가입한 사용자 수를 조회합니다.
  4. 총 에세이 수를 조회합니다.
  5. 오늘 작성된 에세이 수를 조회합니다.
  6. 발행된 에세이 수를 조회합니다.
  7. 링크드아웃된 에세이 수를 조회합니다.
  8. 처리되지 않은 리포트 수를 조회합니다.
  9. 처리되지 않은 리뷰 수를 조회합니다.
  `,
  })
  @ApiResponse({ status: 200, type: DashboardResDto })
  async dashboard(@Req() req: ExpressRequest) {
    return this.adminService.dashboard();
  }

  @Get('statistics/essays/daily')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '월간 일별 에세이 작성 카운트',
    description: `
  월간 일별 에세이 작성 수를 조회합니다.
    
  **쿼리 파라미터:**
  - \`year\`: 조회할 연도 (기본값: 현재 연도)
  - \`month\`: 조회할 월 (기본값: 현재 월, 1~12 범위)
    
  **동작 과정:**
  1. 제공된 연도와 월을 기준으로 월의 첫날과 마지막 날을 계산합니다.
  2. 해당 기간 동안의 일별 에세이 작성 수를 조회합니다.
  3. 일별 데이터를 반환합니다.
    
  **주의 사항:**
  - \`year\`와 \`month\`가 제공되지 않으면 현재 연도와 월을 기본값으로 사용합니다.
  - 응답 예시는 월의 각 일자에 해당하는 작성 수를 포함합니다.
  `,
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
    summary: '년간 월별 에세이 작성 카운트',
    description: `
  년간 월별 에세이 작성 통계를 조회합니다.

  **쿼리 파라미터:**
  - \`year\`: 조회할 연도 (기본값: 현재 연도)

  **동작 과정:**
  1. 제공된 연도를 기준으로 월별 첫날과 마지막 날을 계산합니다.
  2. 해당 기간 동안의 월별 유저 유입 수를 조회합니다.
  3. 월별 데이터를 반환합니다.

  **주의 사항:**
  - \`year\`가 제공되지 않으면 현재 연도를 기본값으로 사용합니다.
  - 응답 예시는 월의 각 월에 해당하는 유저 유입 수를 포함합니다.
  `,
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
  @ApiOperation({
    summary: '월간 일별 유저 유입 통계',
    description: `
  월간 일별 유저 유입 통계를 조회합니다.
    
  **쿼리 파라미터:**
  - \`year\`: 조회할 연도 (기본값: 현재 연도)
  - \`month\`: 조회할 월 (기본값: 현재 월, 1~12 범위)
    
  **동작 과정:**
  1. 제공된 연도와 월을 기준으로 월의 첫날과 마지막 날을 계산합니다.
  2. 해당 기간 동안의 일별 유저 유입 수를 조회합니다.
  3. 일별 데이터를 반환합니다.
    
  **주의 사항:**
  - \`year\`와 \`month\`가 제공되지 않으면 현재 연도와 월을 기본값으로 사용합니다.
  - 응답 예시는 월의 각 일자에 해당하는 유저 유입 수를 포함합니다.
  `,
  })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiResponse({
    status: 200,
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
  @ApiOperation({
    summary: '년간 월별 유저 유입 통계',
    description: `
  년간 월별 유저 유입 통계를 조회합니다.

  **쿼리 파라미터:**
  - \`year\`: 조회할 연도 (기본값: 현재 연도)

  **동작 과정:**
  1. 제공된 연도를 기준으로 월별 첫날과 마지막 날을 계산합니다.
  2. 해당 기간 동안의 월별 유저 유입 수를 조회합니다.
  3. 월별 데이터를 반환합니다.

  **주의 사항:**
  - \`year\`가 제공되지 않으면 현재 연도를 기본값으로 사용합니다.
  - 응답 예시는 월의 각 월에 해당하는 유저 유입 수를 포함합니다.
  `,
  })
  @ApiQuery({ name: 'year', required: false })
  @ApiResponse({
    status: 200,
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
  @ApiOperation({
    summary: '월간 일별 구독 가입 통계',
    description: `
  월간 일별 구독 가입 통계를 조회합니다.

  **쿼리 파라미터:**
  - \`year\`: 조회할 연도 (기본값: 현재 연도)
  - \`month\`: 조회할 월 (기본값: 현재 월)

  **동작 과정:**
  1. 제공된 연도와 월을 기준으로 일별 첫날과 마지막 날을 계산합니다.
  2. 해당 기간 동안의 일별 구독 가입 수를 조회합니다.
  3. 일별 데이터를 반환합니다.

  **주의 사항:**
  - \`year\`와 \`month\`가 제공되지 않으면 현재 연도와 월을 기본값으로 사용합니다.
  - 응답 예시는 일별 구독 가입 수를 포함합니다.
  `,
  })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiResponse({
    status: 200,
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
  @ApiOperation({
    summary: '년간 월별 구독 가입 통계',
    description: `
  년간 월별 구독 가입 통계를 조회합니다.

  **쿼리 파라미터:**
  - \`year\`: 조회할 연도 (기본값: 현재 연도)

  **동작 과정:**
  1. 제공된 연도를 기준으로 월별 첫날과 마지막 날을 계산합니다.
  2. 해당 기간 동안의 월별 구독 가입 수를 조회합니다.
  3. 월별 데이터를 반환합니다.

  **주의 사항:**
  - \`year\`가 제공되지 않으면 현재 연도를 기본값으로 사용합니다.
  - 응답 예시는 월별 구독 가입 수를 포함합니다.
  `,
  })
  @ApiQuery({ name: 'year', required: false })
  @ApiResponse({
    status: 200,
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
    summary: '리포트 리스트',
    description: `
  확인되지 않은 신고를 조회하는 API입니다. 신고 수가 많은 순으로 정렬하여 반환합니다.

  **쿼리 파라미터:**
  - \`sort\`: 정렬 기준 (예: 'most' 또는 'oldest')
  - \`page\`: 페이지 번호 (기본값: 1)
  - \`limit\`: 한 페이지에 표시할 신고 수 (기본값: 10)

  **동작 과정:**
  1. 정렬 기준에 따라 신고 데이터를 조회합니다.
  2. 페이지네이션을 적용하여 특정 페이지의 신고 목록을 가져옵니다.
  3. 조회된 신고 목록과 총 신고 수, 총 페이지 수 등을 반환합니다.

  **주의 사항:**
  - \`sort\` 파라미터는 필수입니다.
  - \`page\`와 \`limit\`는 선택 사항으로, 제공되지 않으면 기본값이 사용됩니다.
  `,
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
  @ApiOperation({
    summary: '리포트 상세 조회',
    description: `
  특정 에세이에 대한 상세 리포트를 조회합니다.

  **경로 파라미터:**
  - \`essayId\`: 조회할 에세이의 고유 ID

  **동작 과정:**
  1. 해당 에세이의 상세 정보를 조회합니다.
  2. 에세이와 연관된 리포트 목록을 조회합니다.
  3. 각 리포트의 상세 정보를 포함하여 반환합니다.

  **주의 사항:**
  - 유효한 에세이 ID가 제공되어야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: ReportDetailResDto })
  async getEssayReports(@Param('essayId', ParseIntPipe) essayId: number) {
    return this.adminService.getReportDetails(essayId);
  }

  @Post('reports/:essayId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '리포트 처리',
    description: `
  특정 에세이에 대한 리포트를 처리합니다.

  **경로 파라미터:**
  - \`essayId\`: 처리할 에세이의 고유 ID

  **요청 본문:**
  - \`actionType\`: 처리 유형 (예: 'approved', 'rejected', 'pending')
  - \`comment\`: 선택적 코멘트

  **동작 과정:**
  1. 에세이를 조회하여 존재 여부를 확인합니다.
  2. \`actionType\`에 따라 에세이를 처리합니다.
  3. 에세이와 관련된 모든 리포트를 동기화하여 처리 상태로 변경합니다.
  4. 처리 내역을 기록합니다.

  **주의 사항:**
  - 유효한 에세이 ID가 제공되어야 하며, 해당 에세이가 존재해야 합니다.
  - 처리할 리포트가 존재해야 합니다.
  `,
  })
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
  @ApiOperation({
    summary: '리뷰 리스트',
    description: `
  관리자용 리뷰 목록을 조회합니다.

  **쿼리 파라미터:**
  - \`page\`: 조회할 페이지 번호 (기본값: 1)
  - \`limit\`: 한 페이지에 조회할 리뷰 수 (기본값: 10)

  **동작 과정:**
  1. 지정된 페이지와 한 페이지당 조회할 리뷰 수를 기반으로 리뷰 목록을 조회합니다.
  2. 각 리뷰에 대한 정보를 변환하여 반환합니다.
  
  **주의 사항:**
  - 페이지 번호와 한 페이지당 조회할 리뷰 수는 선택적으로 제공될 수 있습니다.
  `,
  })
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
  @ApiOperation({
    summary: '리뷰 상세',
    description: `
  특정 리뷰의 상세 정보를 조회합니다.

  **경로 파라미터:**
  - \`reviewId\`: 조회할 리뷰의 ID

  **동작 과정:**
  1. 리뷰 ID를 기반으로 해당 리뷰의 상세 정보를 조회합니다.
  2. 조회된 리뷰 정보를 변환하여 반환합니다.
  
  **주의 사항:**
  - 유효하지 않은 리뷰 ID를 요청할 경우 오류가 발생할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200, type: DetailReviewResDto })
  async getReview(@Param('reviewId', ParseIntPipe) reviewId: number) {
    return this.adminService.detailReview(reviewId);
  }

  @Post('review/:reviewId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '리뷰 처리',
    description: `
  특정 리뷰를 처리합니다.

  **경로 파라미터:**
  - \`reviewId\`: 처리할 리뷰의 ID

  **요청 바디:**
  - \`actionType\`: 리뷰에 대한 처리 유형 (예: 'approved', 'rejected', 'pending')
  - \`comment\`: 처리에 대한 추가 설명 (선택 사항)

  **동작 과정:**
  1. 리뷰 ID를 기반으로 해당 리뷰를 조회합니다.
  2. 리뷰를 처리하고, 처리 유형에 따라 에세이 상태를 업데이트합니다.
  3. 처리 기록을 생성하여 저장합니다.
  
  **주의 사항:**
  - 유효하지 않은 리뷰 ID를 요청할 경우 오류가 발생할 수 있습니다.
  - 관리자 권한이 필요합니다.
  `,
  })
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
  @ApiOperation({
    summary: '유저 리스트 조회',
    description: `
  관리자가 유저 리스트를 조회합니다. 다양한 필터와 페이지네이션을 사용하여 유저 목록을 조회할 수 있습니다.

  **쿼리 파라미터:**
  - \`page\`: 조회할 페이지 번호 (기본값: 1)
  - \`limit\`: 한 페이지에 조회할 유저 수 (기본값: 10)
  - \`filter\`: 필터 옵션 ('all', 'monitored', 'activeSubscription')

  **동작 과정:**
  1. 필터와 페이지네이션 옵션을 적용하여 유저 목록을 조회합니다.
  2. 조회된 유저 목록과 총 페이지 수, 현재 페이지, 총 유저 수를 반환합니다.

  **주의 사항:**
  - 필터 옵션은 선택 사항이며, 값을 제공하지 않으면 기본값 'all'로 설정됩니다.
  - 관리자 권한이 필요합니다.
  `,
  })
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
  @ApiOperation({
    summary: '유저 상세 조회',
    description: `
  관리자 권한으로 특정 유저의 상세 정보를 조회합니다.
  
  **경로 파라미터:**
  - \`userId\`: 조회할 유저의 고유 ID

  **동작 과정:**
  1. 해당 유저의 상세 정보를 조회합니다.
  2. 유저의 총 신고 수, 작성한 에세이 수, 리뷰 수를 포함한 정보를 반환합니다.

  **주의 사항:**
  - 관리자 권한이 필요합니다.
  `,
  })
  @ApiResponse({ status: 200, type: UserDetailResDto })
  async getUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.getUser(userId);
  }

  @Put('users/:userId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '유저 정보 수정',
    description: `
  관리자가 특정 유저의 정보를 수정합니다.

  **경로 파라미터:**
  - \`userId\`: 수정할 유저의 고유 ID

  **동작 과정:**
  1. 관리자가 유저 정보를 수정합니다.
  2. 유저 상태가 'banned'로 변경될 경우, 해당 유저의 모든 에세이를 논리적으로 삭제하고 계정을 정지합니다.
  3. 수정된 유저 정보를 반환합니다.

  **주의 사항:**
  - 관리자 권한이 필요합니다.
  `,
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
  @ApiOperation({
    summary: '에세이 리스트 조회',
    description: `
  관리자용 에세이 리스트를 조회합니다.

  **쿼리 파라미터:**
  - \`page\`: 페이지 번호 (기본값: 1)
  - \`limit\`: 한 페이지에 보여질 에세이 수 (기본값: 10)

  **동작 과정:**
  1. 관리자 권한으로 에세이 리스트를 조회합니다.
  2. 페이지네이션을 적용하여 결과를 반환합니다.

  **주의 사항:**
  - 관리자 권한이 필요합니다.
  `,
  })
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
  @ApiOperation({
    summary: '에세이 상세 데이터 조회',
    description: `
  특정 에세이의 상세 데이터를 조회합니다.

  **경로 파라미터:**
  - \`essayId\`: 조회할 에세이의 고유 ID

  **동작 과정:**
  1. 관리자 권한으로 특정 에세이의 상세 데이터를 조회합니다.
  2. 조회된 데이터를 반환합니다.

  **주의 사항:**
  - 관리자 권한이 필요합니다.
  `,
  })
  @ApiResponse({ status: 200, type: FullEssayResDto })
  async getEssay(@Param('essayId', ParseIntPipe) essayId: number) {
    return this.adminService.getFullEssay(essayId);
  }

  @Put('essays/:essayId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '에세이 상태 수정',
    description: `
	관리자 권한으로 특정 에세이의 상태를 수정합니다. 이 API는 발행 및 링크드아웃 취소에 사용됩니다.
	타겟 에세이에 포함된 리포트 및 리뷰를 일괄적으로 '보류' 상태로 변경합니다.

	**경로 파라미터:**
	- \`essayId\`: 상태를 수정할 에세이의 고유 ID

	**요청 바디:**
	- \`status\`: 수정할 에세이의 새로운 상태 (PUBLISHED, LINKEDOUT, PRIVATE)

	**동작 과정:**
	1. 관리자 권한으로 특정 에세이의 상태를 수정합니다.
	2. 에세이와 연관된 리포트 및 리뷰를 '보류' 상태로 일괄 처리합니다.

	**주의 사항:**
	- 관리자 권한이 필요합니다.
	`,
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
    summary: '관리자 처리 기록',
    description: `
  관리자 처리 기록을 조회합니다. 다양한 쿼리 파라미터를 사용하여 기록을 필터링할 수 있습니다.

  **쿼리 파라미터:**
  - \`page\`: 페이지 번호 (기본값: 1)
  - \`limit\`: 페이지당 항목 수 (기본값: 10)
  - \`target\`: 타겟 (report, review, essay, user)
  - \`action\`: 액션 (approved, rejected, pending, unpublished, unlinkedout, deleted)

  **동작 과정:**
  1. 관리자 처리 기록을 페이지네이션과 함께 조회합니다.
  2. 필터 조건에 맞는 기록만 조회합니다.

  **주의 사항:**
  - 관리자 권한이 필요합니다.
  `,
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

  @Get('inactive')
  @ApiOperation({
    summary: '비활성화 어드민 리스트',
    description: `
  비활성화 어드민 리스트를 조회합니다.
    
  **동작 과정:**
  1. \`active\`가 false인 어드민을 조회합니다.
  2. 조회된 어드민 목록을 DTO로 변환하여 반환합니다.
  `,
  })
  @ApiResponse({
    status: 200,
    type: AdminsSchemaDto,
  })
  async getInactiveAdmins() {
    return this.adminService.getInactiveAdmins();
  }

  @Get(':adminId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '어드민 상세조회',
    description: `
  특정 어드민의 상세 정보를 조회합니다.

  **경로 파라미터:**
  - \`adminId\`: 조회할 어드민의 ID

  **동작 과정:**
  1. 주어진 \`adminId\`를 기반으로 해당 어드민의 상세 정보를 조회합니다.
  2. 조회된 어드민 정보를 반환합니다.

  **주의 사항:**
  - 어드민 ID가 유효하지 않으면 \`404 Not Found\` 오류가 발생합니다.
  `,
  })
  @ApiResponse({ status: 200, type: AdminResDto })
  async getAdmin(@Param('adminId', ParseIntPipe) adminId: number) {
    return this.adminService.getAdmin(adminId);
  }

  @Put(':adminId')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiOperation({
    summary: '[루트관리자용] 어드민 활성화 상태 변경',
    description: `
  어드민의 활성화 상태를 변경합니다. 이 기능은 루트 관리자가 사용합니다.

  **경로 파라미터:**
  - \`adminId\`: 활성화 상태를 변경할 어드민의 ID
  
  **쿼리 파라미터:**
  - \`active\`: 활성화 또는 비활성화 상태 (true 또는 false)

  **동작 과정:**
  1. 주어진 \`adminId\`를 기반으로 해당 어드민의 활성화 상태를 조회합니다.
  2. \`active\` 파라미터를 통해 활성화 또는 비활성화 상태로 설정합니다.
  3. 변경된 활성화 상태의 어드민 정보를 반환합니다.

  **주의 사항:**
  - 루트 관리자가 아닌 경우 \`403 Forbidden\` 오류가 발생합니다.
  - 어드민 ID가 유효하지 않으면 \`404 Not Found\` 오류가 발생합니다.
  `,
  })
  @ApiResponse({ status: 200, type: AdminResDto })
  @ApiQuery({ name: 'active', required: true })
  async activationSettings(
    @Req() req: ExpressRequest,
    @Param('adminId', ParseIntPipe) adminId: number,
    @Query('active', ParseBoolPipe) active: boolean,
  ) {
    return this.adminService.activationSettings(req.user.id, adminId, active);
  }
}
