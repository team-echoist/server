import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../core/auth.service';
import { LoginReqDto } from '../dto/request/loginReq.dto';
import { CreateUserReqDto } from '../dto/request/createUserReq.dto';
import { OauthMobileReqDto } from '../dto/request/OauthMobileReq.dto';
import { CheckNicknameReqDto } from '../dto/request/checkNicknameReq.dto';
import { CheckEmailReqDto } from '../dto/request/checkEmailReq.dto';
import { EmailReqDto } from '../dto/request/emailReq.dto';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../../../common/guards/jwtAuth.guard';
import { Public } from '../../../../common/decorators/public.decorator';
import { JwtResDto } from '../dto/response/jwtRes.dto';
import { VerifyCodeReqDto } from '../dto/request/verifyCodeReq.dto';

@ApiTags('Auth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  @Post('check/email')
  @Public()
  @ApiOperation({
    summary: '🟢 이메일 중복 검사',
    description: `
  회원가입 페이지에서 이메일 주소의 중복 여부를 검사합니다.

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
    summary: '🟢 닉네임 중복 검사',
    description: `
  사용자 닉네임의 중복 여부를 검사합니다.

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
    summary: '🟢 비밀번호 재설정',
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

  //-------------------------------------------------------OAuth
  //-------------------------------------------------------OAuth
  //-------------------------------------------------------OAuth
  @Get('google')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-구글 로그인',
    description: `
  사용자가 구글 계정을 통해 로그인할 수 있도록 합니다.

  **동작 과정:**
  1. 사용자가 구글 로그인 버튼을 클릭하면, 구글 로그인 페이지로 리다이렉션됩니다.
  2. 사용자가 구글 계정으로 인증을 완료하면, 구글 콜백 URL로 리다이렉션됩니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async google() {
    return;
  }

  @Get('google/callback')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-구글 콜백',
    description: `
  구글 로그인 후 콜백을 처리합니다. 사용자의 구글 정보를 검증하고, 새로운 사용자인 경우 계정을 생성합니다.

  **동작 과정:**
  1. 구글로부터 전달된 사용자 정보를 검증합니다.
  2. 사용자가 처음 로그인하는 경우, 새로운 계정을 생성합니다.
  3. 기존 사용자라면, 로그인 정보를 업데이트합니다.
  4. 인증에 성공하면 쿼리스트링에 JWT를 세팅하고 리다이렉션 합니다.

  **주의 사항:**
  - 유효하지 않은 구글 사용자 정보가 전달될 경우, 인증이 실패할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    req.user = await this.authService.oauthLogin(req.user);
    const jwt = await this.authService.login(req);

    let redirectUrl = this.configService.get<string>('WEB_REGISTER_REDIRECT');

    redirectUrl += `?accessToken=${jwt.accessToken}&refreshToken=${jwt.refreshToken}`;

    res.redirect(redirectUrl);
  }

  @Post('google/mobile')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-구글 모바일 로그인',
    description: `
  모바일 기기에서 구글 OAuth를 통해 로그인합니다.

  **요청 본문:**
  - \`token\`: 구글 인증 토큰

  **동작 과정:**
  1. 클라이언트로부터 구글 인증 토큰과 사용자 ID를 받습니다.
  2. 구글 OAuth 클라이언트를 사용하여 토큰을 검증합니다.
  3. 토큰이 유효한 경우, 사용자 정보를 추출합니다.
  4. 인증에 성공하면 JWT를 반환합니다.

  **주의 사항:**
  - 구글 인증 토큰이 유효하지 않으면 오류가 발생합니다.
  - 안드로이드 클라이언트를 위한 별도의 클라이언트 ID가 필요합니다.
  `,
  })
  @ApiBody({ type: OauthMobileReqDto })
  @ApiResponse({ status: 200, type: JwtResDto })
  async mobileGoogleLogin(@Req() req: ExpressRequest, @Body() oauthData: OauthMobileReqDto) {
    req.user = await this.authService.validateGoogleUser(oauthData.token);
    return await this.authService.login(req);
  }

  @Get('kakao')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-카카오 로그인',
    description: `
  사용자가 카카오 계정을 통해 로그인할 수 있도록 합니다.

  **동작 과정:**
  1. 사용자가 카카오 로그인 버튼을 클릭하면, 카카오 로그인 페이지로 리다이렉션됩니다.
  2. 사용자가 카카오 계정으로 인증을 완료하면, 카카오 콜백 URL로 리다이렉션됩니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuthRedirect() {
    return;
  }

  @Get('kakao/callback')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-카카오 콜백',
    description: `
  카카오 로그인 후 콜백을 처리합니다. 사용자의 카카오 정보를 검증하고, 새로운 사용자인 경우 계정을 생성합니다.

  **동작 과정:**
  1. 카카오로부터 전달된 사용자 정보를 검증합니다.
  2. 사용자가 처음 로그인하는 경우, 새로운 계정을 생성합니다.
  3. 기존 사용자라면, 로그인 정보를 업데이트합니다.
  4. 인증에 성공하면 쿼리스트링에 JWT를 세팅하고 리다이렉션 합니다.

  **주의 사항:**
  - 유효하지 않은 카카오 사용자 정보가 전달될 경우, 인증이 실패할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    req.user = await this.authService.oauthLogin(req.user);
    const jwt = await this.authService.login(req);
    let redirectUrl = this.configService.get<string>('WEB_REGISTER_REDIRECT');

    redirectUrl += `?accessToken=${jwt.accessToken}&refreshToken=${jwt.refreshToken}`;

    res.redirect(redirectUrl);
  }

  @Post('kakao/mobile')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-카카오 모바일 로그인',
    description: `
  모바일 기기에서 카카오 OAuth를 통해 로그인합니다.

  **요청 본문:**
  - \`token\`: 카카오 인증 토큰

  **동작 과정:**
  1. 클라이언트로부터 카카오 인증 토큰과 사용자 ID를 받습니다.
  2. 카카오 OAuth 클라이언트를 사용하여 토큰을 검증합니다.
  3. 토큰이 유효한 경우, 사용자 정보를 추출합니다.
  4. 인증에 성공하면 JWT를 반환합니다.

  **주의 사항:**
  - 카카오 인증 토큰이 유효하지 않으면 오류가 발생합니다.
  `,
  })
  @ApiBody({ type: OauthMobileReqDto })
  @ApiResponse({ status: 201, type: JwtResDto })
  async mobileKakaoLogin(@Req() req: ExpressRequest, @Body() oauthData: OauthMobileReqDto) {
    req.user = await this.authService.validateKakaoUser(oauthData.token);

    return await this.authService.login(req);
  }

  @Get('naver')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-네이버 로그인',
    description: `
  사용자가 네이버 계정을 통해 로그인할 수 있도록 합니다.

  **동작 과정:**
  1. 사용자가 네이버 로그인 버튼을 클릭하면, 네이버 로그인 페이지로 리다이렉션됩니다.
  2. 사용자가 네이버 계정으로 인증을 완료하면, 네이버 콜백 URL로 리다이렉션됩니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('naver'))
  async naverAuthRedirect() {
    return;
  }

  @Get('naver/callback')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-네이버 콜백',
    description: `
  네이버 로그인 후 콜백을 처리합니다. 사용자의 네이버 정보를 검증하고, 새로운 사용자인 경우 계정을 생성합니다.

  **동작 과정:**
  1. 네이버로부터 전달된 사용자 정보를 검증합니다.
  2. 사용자가 처음 로그인하는 경우, 새로운 계정을 생성합니다.
  3. 기존 사용자라면, 로그인 정보를 업데이트합니다.
  4. 인증에 성공하면 쿼리스트링에 JWT를 세팅하고 리다이렉션 합니다.

  **주의 사항:**
  - 유효하지 않은 네이버 사용자 정보가 전달될 경우, 인증이 실패할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('naver'))
  async naverCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    req.user = await this.authService.oauthLogin(req.user);
    const jwt = await this.authService.login(req);

    let redirectUrl = this.configService.get<string>('WEB_REGISTER_REDIRECT');

    redirectUrl += `?accessToken=${jwt.accessToken}&refreshToken=${jwt.refreshToken}`;

    res.redirect(redirectUrl);
  }

  @Post('naver/mobile')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-네이버 모바일 로그인',
    description: `
  모바일 기기에서 네이버 OAuth를 통해 로그인합니다.

  **요청 본문:**
  - \`token\`: 네이버 인증 토큰

  **동작 과정:**
  1. 클라이언트로부터 네이버 인증 토큰과 사용자 ID를 받습니다.
  2. 네이버 OAuth 클라이언트를 사용하여 토큰을 검증합니다.
  3. 토큰이 유효한 경우, 사용자 정보를 추출합니다.
  4. jwt를 반환합니다.

  **주의 사항:**
  - 네이버 인증 토큰이 유효하지 않으면 오류가 발생합니다.
  `,
  })
  @ApiBody({ type: OauthMobileReqDto })
  @ApiResponse({ status: 201, type: JwtResDto })
  async mobileNaverLogin(@Req() req: ExpressRequest, @Body() oauthData: OauthMobileReqDto) {
    req.user = await this.authService.validateNaverUser(oauthData.token);
    return await this.authService.login(req);
  }

  @Get('apple')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-애플 로그인',
    description: `
  사용자가 애플 계정을 통해 로그인할 수 있도록 합니다.

  **동작 과정:**
  1. 사용자가 애플 로그인 버튼을 클릭하면, 애플 로그인 페이지로 리다이렉션됩니다.
  2. 사용자가 애플 계정으로 인증을 완료하면, 애플 콜백 URL로 리다이렉션됩니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('apple'))
  async appleAuthRedirect() {
    return;
  }

  @Post('apple/callback')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-애플 콜백',
    description: `
  애플 로그인 후 콜백을 처리합니다. 사용자의 애플 정보를 검증하고, 새로운 사용자인 경우 계정을 생성합니다.

  **동작 과정:**
  1. 애플로부터 전달된 사용자 정보를 검증합니다.
  2. 사용자가 처음 로그인하는 경우, 새로운 계정을 생성합니다.
  3. 기존 사용자라면, 로그인 정보를 업데이트합니다.
  4. 인증에 성공하면 쿼리스트링에 JWT를 세팅하고 리다이렉션 합니다.

  **주의 사항:**
  - 유효하지 않은 네이버 사용자 정보가 전달될 경우, 인증이 실패할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('apple'))
  async appleCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    req.user = await this.authService.oauthLogin(req.user);
    const jwt = await this.authService.login(req);
    let redirectUrl = this.configService.get<string>('WEB_REGISTER_REDIRECT');

    redirectUrl += `?accessToken=${jwt.accessToken}&refreshToken=${jwt.refreshToken}`;

    res.redirect(redirectUrl);
  }

  @Post('apple/mobile')
  @Public()
  @ApiOperation({
    summary: '🟢 OAuth-애플 모바일 로그인',
    description: `
  모바일 기기에서 애플 OAuth를 통해 로그인합니다.

  **요청 본문:**
  - \`token\`: 애플 인증 토큰(id_token)

  **동작 과정:**
  1. 모바일 환경에서 애플 로그인을 통해 받은 userToken을 디코딩합니다.
  2. 사용자가 처음 로그인하는 경우, 새로운 계정을 생성합니다.
  3. 기존 사용자라면, 로그인 정보를 업데이트합니다.
  4. 인증에 성공하면 JWT를 반환합니다.

  **주의 사항:**
  - 애플 인증 토큰이 유효하지 않으면 오류가 발생합니다.
  `,
  })
  @ApiBody({ type: OauthMobileReqDto })
  @ApiResponse({ status: 201, type: JwtResDto })
  async mobileAppleLogin(@Req() req: ExpressRequest, @Body() oauthData: OauthMobileReqDto) {
    req.user = await this.authService.validateAppleUser(oauthData.token);
    return await this.authService.login(req);
  }
}
