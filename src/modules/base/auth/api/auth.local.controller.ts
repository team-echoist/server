import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { Public } from '../../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwtAuth.guard';
import { AuthService } from '../core/auth.service';
import { CheckEmailReqDto } from '../dto/request/checkEmailReq.dto';
import { CheckNicknameReqDto } from '../dto/request/checkNicknameReq.dto';
import { CreateUserReqDto } from '../dto/request/createUserReq.dto';
import { EmailReqDto } from '../dto/request/emailReq.dto';
import { LoginReqDto } from '../dto/request/loginReq.dto';
import { VerifyCodeReqDto } from '../dto/request/verifyCodeReq.dto';
import { JwtResDto } from '../dto/response/jwtRes.dto';

@ApiTags('Auth-local')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthLocalController {
  constructor(private readonly authService: AuthService) {}

  @Post('check/email')
  @Public()
  @ApiOperation({
    summary: '🟢 [삭제예정] 이메일 중복 검사',
    description: `
  회원가입 페이지 또는 회원정보 수정시 이메일 중복 여부를 검사합니다.
  해당 api는 삭제될 예정입니다. \`user\` 경로를 이용해주세요.

  **동작 과정:**
  1. 클라이언트에서 이메일 주소를 요청 본문으로 전달합니다.
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
  @ApiBody({ type: CheckEmailReqDto })
  async checkEmail(@Body() data: CheckEmailReqDto) {
    return this.authService.checkEmail(data.email);
  }

  @Post('check/nickname')
  @Public()
  @ApiOperation({
    summary: '🟢 [삭제예정] 닉네임 중복 검사',
    description: `
  회원정보 수정시 닉네임의 중복 여부를 검사에 사용됩니다.
  해당 api는 삭제될 예정입니다. \`user\` 경로를 이용해주세요.

  **동작 과정:**
  1. 클라이언트에서 닉네임을 요청 본문으로 전달합니다.
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
  @ApiBody({ type: CheckNicknameReqDto })
  async checkNick(@Body() data: CheckNicknameReqDto) {
    return this.authService.checkNickname(data.nickname);
  }

  @Post('email/verify')
  @ApiOperation({
    summary: '이메일 변경 인증코드 발송 요청',
    description: `
  이메일 변경 과정에서 이메일 소유권 확인을 위한 인증코드를 발송합니다.

  **요청 본문:**
  - \`email\`: 변경할 이메일 주소

  **동작 과정:**
  1. 입력된 이메일 주소가 이미 존재하는지 확인합니다.
  2. 존재할 경우, 에러를 반환합니다.
  3. 존재하지 않을 경우, 인증 코드를 생성합니다.
  4. 생성된 코드를 Redis에 저장하고, 유효기간을 설정합니다.
  5. 입력된 이메일 주소로 인증 이메일을 발송합니다.

  **주의 사항:**
  - 이메일 주소가 이미 존재하는 경우, \`400 Bad Request\` 에러가 발생합니다.
  - 인증 코드의 유효기간은 5분입니다.
  `,
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: EmailReqDto })
  async verifyEmail(@Req() req: ExpressRequest, @Body() data: EmailReqDto) {
    await this.authService.verifyEmail(req, data.email);
    return;
  }

  @Post('email/change')
  @ApiOperation({
    summary: '이메일 변경',
    description: `
  코드 인증 후 이메일 변경을 처리합니다.

  **요청 본문:**
  - \`code\`: 이메일 인증 코드

  **동작 과정:**
  1. 제공된 인증 코드를 Redis에서 조회합니다.
  2. 코드가 유효하지 않으면 에러를 반환합니다.
  3. 코드가 유효하면 해당 데이터를 사용하여 새 이메일로 변경합니다.

  **주의 사항:**
  - 유효하지 않은 코드를 제공하면 \`400\` 에러가 발생합니다.
  `,
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: VerifyCodeReqDto })
  async updateEmail(@Req() req: ExpressRequest, @Body() data: VerifyCodeReqDto) {
    await this.authService.updateEmail(req, data.code);
    return;
  }

  @Post('sign')
  @Public()
  @ApiOperation({
    summary: '🟢 로컬 회원가입 인증코드 발송 요청',
    description: `
  회원가입 과정에서 이메일 소유권 확인을 위해 인증코드를 발송합니다.

  **요청 본문:**
  - \`email\`: 회원가입할 이메일 주소
  - \`password\`: 회원가입할 비밀번호

  **동작 과정:**
  1. 입력된 이메일 주소가 이미 존재하는지 확인합니다.
  2. 존재할 경우, 에러를 반환합니다.
  3. 존재하지 않을 경우, 인증 토큰을 생성합니다.
  4. 생성된 토큰을 Redis에 저장하고, 유효기간을 설정합니다.
  5. 입력된 이메일 주소로 인증 이메일을 발송합니다.

  **주의 사항:**
  - 이메일 주소가 이미 존재하는 경우, \`400 Bad Request\` 에러가 발생합니다.
  - 인증 토큰의 유효기간은 5분입니다.
  `,
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: CreateUserReqDto })
  async sign(@Req() req: ExpressRequest, @Body() createUserDto: CreateUserReqDto) {
    await this.authService.signingUp(req, createUserDto);
    return;
  }

  @Post('register')
  @Public()
  @ApiOperation({
    summary: '🟢 로컬 회원등록',
    description: `
  인증메일로 발송된 6자리 코드를 입력해 회원등록을 완료합니다.

  **요청 본문:**
  - \`code\`: 인증 코드

  **동작 과정:**
  1. 제공된 인증 코드와 요청자 IP로 Redis에서 조회합니다.
  2. 코드가 유효하지 않으면 에러를 반환합니다.
  3. 코드가 유효하면 해당 데이터를 사용하여 새 사용자를 생성합니다.
  4. 닉네임을 자동으로 생성합니다. 기본 닉네임 테이블에서 사용 가능한 닉네임을 찾아 설정합니다.
  5. \`accessToken\` 와 \`refreshToken\` 을 반환합니다.
	
  **주의 사항:**
  - 유효하지 않은 코드을 제공하면 \`400\` 에러가 발생합니다.
  `,
  })
  @ApiResponse({ status: 201, type: JwtResDto })
  @ApiBody({ type: VerifyCodeReqDto })
  async register(@Req() req: ExpressRequest, @Body() data: VerifyCodeReqDto) {
    return await this.authService.register(req, data.code);
  }

  @Post('login')
  @Public()
  @ApiOperation({
    summary: '🟢 로컬 로그인',
    description: `
  사용자 로그인을 처리합니다. 이메일과 비밀번호를 사용하여 인증을 시도합니다.

  **요청 본문:**
  - \`email\`: 사용자 이메일
  - \`password\`: 사용자 비밀번호

  **동작 과정:**
  1. 제공된 이메일과 비밀번호로 사용자를 인증합니다.
  2. 인증에 실패하면 적절한 에러 메시지를 반환합니다.
  3. 사용자가 'BANNED' 상태인 경우, 403을 반환합니다.

  **주의 사항:**
  - 이메일과 비밀번호는 필수 항목입니다.
  - 계정탈퇴 신청 사용자는 202로 응답되며 유예기간까지 일반 사용자와 동일하게 서비스를 이용합니다.
  `,
  })
  @ApiResponse({ status: 200, type: JwtResDto })
  @ApiBody({ type: LoginReqDto })
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: ExpressRequest) {
    return await this.authService.login(req);
  }

  @Post('password/reset')
  @Public()
  @ApiOperation({
    summary: '🟢 로컬 회원 비밀번호 재설정',
    description: `
  제공된 이메일로 임시 비밀번호를 발송합니다.

  **요청 본문:**
  - \`email\`: 사용자 이메일
  
  **동작 과정:**
  1. 제공된 이메일을 검증합니다.
  2. 유효한 이메일이면 임시 비밀번호를 발송합니다.

  **주의 사항:**
  - 유효하지 않은 이메일을 제공하면 \`400\` 에러가 발생합니다.
  - 새로운 비밀번호는 안전하게 저장됩니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async passwordReset(@Body() data: EmailReqDto) {
    return this.authService.passwordReset(data.email);
  }
}
