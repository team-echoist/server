import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/request/loginReq.dto';
import { CreateUserReqDto } from './dto/request/createUserReq.dto';
import { GoogleUserReqDto } from './dto/request/googleUserReq.dto';
import { CheckNicknameReqDto } from './dto/request/checkNicknameReq.dto';
import { CheckEmailReqDto } from './dto/request/checkEmailReq.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health-check')
  @ApiOperation({ summary: 'health check' })
  @ApiResponse({ status: 200 })
  async healthCheck() {
    return 'up';
  }

  @Post('check/email')
  @ApiOperation({
    summary: '이메일 중복 검사',
    description: `
  회원가입 페이지에서 이메일 주소의 중복 여부를 검사합니다.

  **동작 과정:**
  1. 클라이언트에서 이메일 주소를 요청 본문으로 전달합니다.
  2. 서버에서 해당 이메일이 이미 사용 중인지 확인합니다.
  3. 중복된 이메일이 존재하면 예외를 발생시킵니다.
  4. 이메일이 사용 가능한 경우, 성공 응답을 반환합니다.

  **주의 사항:**
  - 올바른 이메일 형식이 입력되어야 합니다.
  - 이미 존재하는 이메일인 경우, HTTP 409 상태 코드와 함께 "Email already exists" 메시지가 반환됩니다.
  - 중복된 이메일이 없으면 HTTP 200 상태 코드와 함께 이메일이 사용 가능하다는 응답을 받습니다.
  `,
  })
  @ApiResponse({
    status: 200,
    description: '이메일이 사용 가능한 경우',
    schema: { type: 'boolean', example: true },
  })
  @ApiResponse({
    status: 409,
    description: '이메일이 이미 존재하는 경우',
    schema: { type: 'boolean', example: false },
  })
  @ApiBody({
    description: '이메일 중복 검사 요청 데이터',
    type: CheckEmailReqDto,
  })
  async checkEmail(@Body() data: CheckEmailReqDto) {
    return this.authService.checkEmail(data.email);
  }

  @Get('check/nickname')
  @ApiOperation({
    summary: '닉네임 중복 검사',
    description: `
  사용자 닉네임의 중복 여부를 검사합니다.

  **동작 과정:**
  1. 클라이언트에서 닉네임을 요청 본문으로 전달합니다.
  2. 서버에서 해당 닉네임이 이미 사용 중인지 확인합니다.
  3. 중복된 닉네임이 존재하면 예외를 발생시킵니다.
  4. 닉네임이 사용 가능한 경우, 성공 응답을 반환합니다.

  **주의 사항:**
  - 닉네임은 한글, 영문자, 숫자, 밑줄(_) 등으로 구성될 수 있습니다.
  - 닉네임은 최소 3자에서 최대 20자까지 허용됩니다.
  - 중복된 닉네임이 발견되면 HTTP 409 상태 코드와 함께 "Nickname already exists" 메시지가 반환됩니다.
  - 중복된 닉네임이 없으면 HTTP 200 상태 코드와 함께 닉네임이 사용 가능하다는 응답을 받습니다.
  `,
  })
  @ApiResponse({
    status: 200,
    description: '닉네임이 사용 가능한 경우',
  })
  @ApiResponse({
    status: 409,
    description: '닉네임이 이미 존재하는 경우',
  })
  @ApiBody({
    description: '닉네임 중복 검사 요청 데이터',
    type: CheckNicknameReqDto,
  })
  async checkNick(@Body() data: CheckNicknameReqDto) {
    return this.authService.checkNickname(data.nickname);
  }

  @Post('verify')
  @ApiOperation({
    summary: '회원가입을 위한 이메일 인증 요청',
    description: `
  회원가입 과정에서 이메일 인증을 요청합니다.

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
  - 인증 토큰의 유효기간은 10분입니다.
  `,
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: CreateUserReqDto })
  async verify(@Body() createUserDto: CreateUserReqDto) {
    await this.authService.isEmailOwned(createUserDto);
    return;
  }

  @Get('register')
  @ApiOperation({
    summary: '회원등록',
    description: `
  이메일 인증 후 회원 등록을 처리합니다. 이메일의 인증 링크를 클릭하면 호출됩니다.

  **쿼리 파라미터:**
  - \`token\`: 이메일 인증 토큰

  **동작 과정:**
  1. 제공된 인증 토큰을 Redis에서 조회합니다.
  2. 토큰이 유효하지 않으면 에러를 반환합니다.
  3. 토큰이 유효하면 해당 데이터를 사용하여 새 사용자를 생성합니다.
  4. 닉네임을 자동으로 생성합니다. 기본 닉네임 테이블에서 사용 가능한 닉네임을 찾아 설정하고, \`isUsed\` 필드를 \`true\`로 업데이트합니다.
  5. 사용자가 모바일 기기(iPhone, iPad, Android)에서 등록한 경우, 딥링크로 리디렉션합니다.
  6. 그 외의 경우, 웹사이트로 리디렉션합니다.

  **주의 사항:**
  - 사용자가 이메일 링크를 클릭시 호출되는 api 입니다.
  - 유효하지 않은 토큰을 제공하면 \`404 Not Found\` 에러가 발생합니다.
  - 모바일 기기에서는 딥링크로 리디렉션되며, 웹에서는 웹사이트로 리디렉션됩니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async register(@Query('token') token: string, @Req() req: ExpressRequest, @Res() res: Response) {
    req.user = await this.authService.register(token);
    if (req.device === 'iPhone' || req.device === 'iPad' || req.device === 'Android') {
      res.redirect('todo 딥링크');
    } else {
      res.redirect('https://www.linkedoutapp.com');
    }
    return;
  }

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: `
  사용자 로그인을 처리합니다. 이메일과 비밀번호를 사용하여 인증을 시도합니다.

  **요청 본문:**
  - \`email\`: 사용자 이메일
  - \`password\`: 사용자 비밀번호

  **동작 과정:**
  1. 제공된 이메일과 비밀번호로 사용자를 인증합니다.
  2. 인증에 실패하면 적절한 에러 메시지를 반환합니다.
  3. 사용자가 'BANNED' 상태인 경우, 403을 반환합니다.
  4. 인증에 성공하면 사용자 정보를 반환합니다.

  **주의 사항:**
  - 이메일과 비밀번호는 필수 항목입니다.
  - 잘못된 이메일 또는 비밀번호로 시도하면 \`401 Unauthorized\` 에러가 발생합니다.
  - 계정이 정지된 사용자는 로그인할 수 없습니다.
  `,
  })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패: 잘못된 이메일 또는 비밀번호' })
  @ApiResponse({ status: 202, description: '탈퇴를 요청한 계정' })
  @ApiResponse({ status: 403, description: '정지 계정' })
  @ApiBody({ type: LoginReqDto })
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: ExpressRequest) {
    return req.user;
  }

  //-------------------------------------------------------OAuth
  @Get('google')
  @ApiOperation({
    summary: 'OAuth-구글 로그인',
    description: `
  사용자가 구글 계정을 통해 로그인할 수 있도록 합니다.

  **동작 과정:**
  1. 사용자가 구글 로그인 버튼을 클릭하면, 구글 로그인 페이지로 리디렉션됩니다.
  2. 사용자가 구글 계정으로 인증을 완료하면, 구글 콜백 URL로 리디렉션됩니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async google() {
    return;
  }

  @Get('google/callback')
  @ApiOperation({
    summary: '구글 OAuth 콜백',
    description: `
  구글 로그인 후 콜백을 처리합니다. 사용자의 구글 정보를 검증하고, 새로운 사용자인 경우 계정을 생성합니다.

  **동작 과정:**
  1. 구글로부터 전달된 사용자 정보를 검증합니다.
  2. 사용자가 처음 로그인하는 경우, 새로운 계정을 생성합니다.
  3. 기존 사용자라면, 로그인 정보를 업데이트합니다.
  4. 사용자 정보를 기반으로 JWT 토큰을 생성하여 응답합니다.

  **주의 사항:**
  - 유효하지 않은 구글 사용자 정보가 전달될 경우, 인증이 실패할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: ExpressRequest) {
    req.user = await this.authService.oauthLogin(req.user);
    return;
  }

  @Post('google/android')
  @ApiOperation({
    summary: 'OAuth-구글 안드로이드 로그인',
    description: `
  안드로이드 기기에서 구글 OAuth를 통해 로그인합니다.

  **요청 본문:**
  - \`token\`: 구글 인증 토큰
  - \`id\`: 사용자의 고유 ID

  **동작 과정:**
  1. 클라이언트로부터 구글 인증 토큰과 사용자 ID를 받습니다.
  2. 구글 OAuth 클라이언트를 사용하여 토큰을 검증합니다.
  3. 토큰이 유효한 경우, 사용자 정보를 추출합니다.
  4. 추출된 사용자 정보를 기반으로 OAuth 로그인 처리를 합니다.

  **주의 사항:**
  - 구글 인증 토큰이 유효하지 않으면 오류가 발생합니다.
  - 안드로이드 클라이언트를 위한 별도의 클라이언트 ID가 필요합니다.
  `,
  })
  @ApiBody({ type: GoogleUserReqDto })
  @ApiResponse({ status: 200 })
  async androidGoogleLogin(@Req() req: ExpressRequest, @Body() googleUserData: GoogleUserReqDto) {
    req.user = await this.authService.validateGoogleUser(googleUserData);
    return req.user;
  }

  // @Post('kakao')
  // @ApiOperation({
  //   summary: 'OAuth-카카오 로그인',
  // })
  // @ApiResponse({ status: 200 })
  // @UseGuards(AuthGuard('google'))
  // async kakaoAuthRedirect() {
  //   return;
  // }
  //
  // @Post('naver')
  // @ApiOperation({
  //   summary: 'OAuth-네이버 로그인',
  // })
  // @ApiResponse({ status: 200 })
  // @UseGuards(AuthGuard('google'))
  // async naverAuthRedirect() {
  //   return;
  // }
}
