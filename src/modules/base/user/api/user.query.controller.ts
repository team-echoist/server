import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { Public } from '../../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwtAuth.guard';
import { UserService } from '../core/user.service';
import { UserSummaryResDto } from '../dto/response/userSummaryRes.dto';
import { UserSummaryWithCountResDto } from '../dto/response/userSummaryWithCountRes.dto';
import { UserSummaryWithStatsResDto } from '../dto/response/userSummaryWithStatsRes.dto';

@ApiTags('User-query')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserQueryController {
  constructor(private readonly userService: UserService) {}

  @Get('check/email/:email')
  @Public()
  @ApiOperation({
    summary: '🟢 이메일 중복 검사',
    description: `
  회원가입 페이지 또는 회원정보 수정시 이메일 중복 여부를 검사합니다.
  
  **경로 파라미터:**
  - \`email\`: 조회할 이메일

  **동작 과정:**
  1. 클라이언트에서 이메일 주소를 경로 파라미터로 전달합니다.
  2. 서버에서 해당 이메일이 이미 사용 중인지 확인합니다.
  3. 중복된 이메일이 존재하면 예외를 발생시킵니다.
  4. 이메일이 사용 가능한 경우, 성공 응답을 반환합니다.

  **주의 사항:**
  - 올바른 이메일 형식이 입력되어야 합니다.
  - 이미 존재하는 이메일인 경우, 409 코드를 반환됩니다.
  - 중복된 이메일이 없으면 200 상태 코드와 함께 이메일이 사용 가능하다는 응답을 받습니다.
  `,
  })
  @ApiResponse({
    status: 200,
    schema: { type: 'boolean', example: true },
  })
  @ApiParam({ name: 'email' })
  async checkEmail(@Param() email: string) {
    return this.userService.checkEmail(email);
  }

  @Get('check/nickname/:nickname')
  @Public()
  @ApiOperation({
    summary: '🟢 닉네임 중복 검사',
    description: `
  회원정보 수정시 닉네임의 중복 여부를 검사에 사용됩니다.
  
  **경로 파라미터:**
  - \`nickname\`: 조회할 닉네임

  **동작 과정:**
  1. 클라이언트에서 닉네임을 경로 파라미터로 전달합니다.
  2. 서버에서 해당 닉네임이 이미 사용 중인지 확인합니다.
  3. 중복된 닉네임이 존재하면 예외를 발생시킵니다.
  4. 닉네임이 사용 가능한 경우, 성공 응답을 반환합니다.

  **주의 사항:**
  - 닉네임은 오직 한글, 최소 1~6자까지 허용합니다.
  - 중복된 닉네임이 발견되면 409 코드룰 반환됩니다.
  - 중복된 닉네임이 없으면 200 상태 코드와 함께 닉네임이 사용 가능하다는 응답을 받습니다.
  `,
  })
  @ApiResponse({
    status: 200,
    description: '닉네임이 사용 가능한 경우',
  })
  @ApiParam({ name: 'nickname' })
  async checkNick(@Param() nickname: string) {
    return this.userService.checkNickname(nickname);
  }

  @Get('summary')
  @ApiOperation({
    summary: '유저 요약 정보 및 주간 에세이 통계 조회',
    description: `
  로그인한 사용자의 요약 정보를 조회합니다. 

  **동작 과정:**
  1. 요청 헤더의 인증 토큰을 사용하여 사용자를 식별합니다.
  2. 사용자의 요약 정보를 포함하여 최근 5주간의 에세이 작성 통계를 반환합니다.

  **응답 필드:**
  - \`summary\`: 사용자의 기본 정보 (ID, 닉네임, 프로필 이미지, 가입일 등)
  - \`weeklyEssayCounts\`: 최근 5주간의 주별 에세이 작성 개수 및 기간

  **주의 사항:**
  - 인증 토큰이 유효하지 않거나 제공되지 않으면 \`401 Unauthorized\` 에러가 발생합니다.
  - 요청이 성공하면 \`200 OK\` 상태를 반환합니다.
  `,
  })
  @ApiResponse({ type: UserSummaryWithCountResDto })
  async userSummary(@Req() req: ExpressRequest) {
    return this.userService.getUserSummary(req.user.id);
  }

  @Get('info')
  @ApiOperation({
    summary: '본인 기본정보',
    description: `
  본인 아이디, 닉네임, 프로필이미지, 생성일, 최초접속여부 ,위치기반서비스동의여부, 등록된 디바이스, 홈 레이아웃 정보 등을 조회합니다.

  **동작 과정:**
  1. 사용자의 ID를 기반으로 해당 사용자의 기본 정보를 조회합니다.

  **주의 사항:**
  - 유효한 사용자 ID가 제공되어야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: UserSummaryResDto })
  async getMyInfo(@Req() req: ExpressRequest) {
    return this.userService.getUserInfo(req.user.id);
  }

  @Get('profile/my')
  @ApiOperation({
    summary: '본인 프로필 조회',
    description: `
  본인 프로필 정보를 조회합니다. 이 API는 사용자의 기본 정보와 에세이 통계를 반환합니다.

  **동작 과정:**
  1. 사용자의 ID를 기반으로 해당 사용자의 기본 정보를 조회합니다.
  2. 사용자의 에세이 통계를 조회합니다.
  3. 조회된 정보를 합쳐서 반환합니다.

  **주의 사항:**
  - 유효한 사용자 ID가 제공되어야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: UserSummaryWithStatsResDto })
  async getMyProfile(@Req() req: ExpressRequest) {
    return this.userService.getUserProfile(req.user.id);
  }

  @Get('profile/:userId')
  @ApiOperation({
    summary: '타겟 유저 프로필',
    description: `
  특정 사용자의 프로필 정보를 조회합니다. 이 API는 사용자의 기본 정보와 에세이 통계를 반환합니다.

  **경로 파라미터:**
  - \`userId\`: 조회할 사용자의 고유 ID

  **동작 과정:**
  1. 사용자의 ID를 기반으로 해당 사용자의 기본 정보를 조회합니다.
  2. 사용자의 에세이 통계를 조회합니다.
  3. 조회된 정보를 합쳐서 반환합니다.

  **주의 사항:**
  - 유효한 사용자 ID가 제공되어야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: UserSummaryWithStatsResDto })
  async getUserProfile(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getUserProfile(userId);
  }
}
