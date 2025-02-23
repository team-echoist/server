import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';

import { Public } from '../../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwtAuth.guard';
import { AuthService } from '../core/auth.service';
import { OauthMobileReqDto } from '../dto/request/OauthMobileReq.dto';
import { JwtResDto } from '../dto/response/jwtRes.dto';

@ApiTags('Auth-oauth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthOauthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

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
  4. 인증에 성공하면 쿼리스트링에 JWT를 세팅하고 웹앱으로 리다이렉션 합니다.

  **주의 사항:**
  - 유효하지 않은 구글 사용자 정보가 전달될 경우, 인증이 실패할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    req.user! = await this.authService.oauthLogin(req.user!!);
    const jwt = await this.authService.login(req);

    let redirectUrl = this.configService.get<string>('WEB_REGISTER_REDIRECT')!;
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
    req.user! = await this.authService.validateGoogleUser(oauthData.token);
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
  4. 인증에 성공하면 쿼리스트링에 JWT를 세팅하고 웹앱으로 리다이렉션 합니다.

  **주의 사항:**
  - 유효하지 않은 카카오 사용자 정보가 전달될 경우, 인증이 실패할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    req.user! = await this.authService.oauthLogin(req.user!);
    const jwt = await this.authService.login(req);
    let redirectUrl = this.configService.get<string>('WEB_REGISTER_REDIRECT')!;

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
    req.user! = await this.authService.validateKakaoUser(oauthData.token);

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
  4. 인증에 성공하면 쿼리스트링에 JWT를 세팅하고 웹앱으로 리다이렉션 합니다.

  **주의 사항:**
  - 유효하지 않은 네이버 사용자 정보가 전달될 경우, 인증이 실패할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('naver'))
  async naverCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    req.user! = await this.authService.oauthLogin(req.user!);
    const jwt = await this.authService.login(req);

    let redirectUrl = this.configService.get<string>('WEB_REGISTER_REDIRECT')!;

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
    req.user! = await this.authService.validateNaverUser(oauthData.token);
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
  4. 인증에 성공하면 쿼리스트링에 JWT를 세팅하고 웹앱으로 리다이렉션 합니다.

  **주의 사항:**
  - 유효하지 않은 네이버 사용자 정보가 전달될 경우, 인증이 실패할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('apple'))
  async appleCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    req.user! = await this.authService.oauthLogin(req.user!);
    const jwt = await this.authService.login(req);
    let redirectUrl = this.configService.get<string>('WEB_REGISTER_REDIRECT')!;

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
    req.user! = await this.authService.validateAppleUser(oauthData.token);
    return await this.authService.login(req);
  }
}
