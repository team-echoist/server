import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/request/loginReq.dto';
import { CreateUserReqDto } from './dto/request/createUserReq.dto';
import { GoogleUserReqDto } from './dto/request/googleUserReq.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health-check')
  @ApiOperation({ summary: 'health check' })
  @ApiResponse({ status: 200 })
  async healthCheck() {
    return '살아있느니라';
  }

  @Get('check')
  @ApiOperation({
    summary: '이메일중복검사',
    description: '회원가입 페이지에서 이메일 입력칸에 이메일형식의 문자열이 완성되었을 때 사용',
  })
  @ApiQuery({ name: 'email', required: true })
  @ApiResponse({ status: 200, type: 'success: boolean' })
  async checkEmail(@Query('email') email: string) {
    return await this.authService.checkEmail(email);
  }

  @Post('verify')
  @ApiOperation({
    summary: '회원가입을 위한 이메일 인증 요청',
    description: '다시 한번 이메일 중복 체크 후 인증 링크 발송',
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: CreateUserReqDto })
  async verify(@Body() createUserDto: CreateUserReqDto) {
    await this.authService.isEmailOwned(createUserDto);

    return;
  }

  @Get('register')
  @ApiOperation({
    summary: 'verify 요청에서 보낸 인증 링크 확인 후 회원 등록, jwt 발급 및 리다이렉트',
    description: '응답 헤더에 토큰을 사용하면 바로 로그인 가능',
  })
  @ApiResponse({ status: 201 })
  async register(@Query('token') token: string, @Req() req: ExpressRequest, @Res() res: Response) {
    req.user = await this.authService.register(token);
    req.device === 'iPhone' || 'iPad' || 'Android'
      ? res.redirect('todo 딥링크')
      : res.redirect('https://www.linkedoutapp.com');

    return;
  }

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: LoginReqDto })
  @UseGuards(AuthGuard('local'))
  async login() {
    return;
  }

  //-----------------------------------OAuth
  @Get('google')
  @ApiOperation({
    summary: 'OAuth-구글 로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async google() {
    return;
  }

  @Get('google/callback')
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: ExpressRequest) {
    req.user = await this.authService.oauthLogin(req.user);
    return;
  }

  @Post('google/android')
  @ApiOperation({ summary: 'OAuth-구글 안드로이드 로그인' })
  @ApiBody({ type: GoogleUserReqDto })
  @ApiResponse({ status: 200 })
  async androidGoogleLogin(@Req() req: ExpressRequest, @Body() googleUserData: GoogleUserReqDto) {
    req.user = await this.authService.validateGoogleUser(googleUserData);
    return req.user;
  }

  @Post('kakao')
  @ApiOperation({
    summary: 'OAuth-카카오 로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async kakaoAuthRedirect() {
    return;
  }

  @Post('naver')
  @ApiOperation({
    summary: 'OAuth-네이버 로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async naverAuthRedirect() {
    return;
  }
}
