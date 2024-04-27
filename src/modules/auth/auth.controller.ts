import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { isBoolean } from 'class-validator';
import { Request as ExpressRequest } from 'express';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/loginReq.dto';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { CheckEmailReqDto } from './dto/checkEamilReq.dto';
import { UserResDto } from './dto/userRes.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health-check')
  @ApiOperation({ summary: 'health check' })
  @ApiResponse({ status: 200 })
  async healthCheck() {
    return 'UP';
  }

  @Get('check-email')
  @ApiOperation({
    summary: '이메일중복검사',
  })
  @ApiBody({ type: CheckEmailReqDto })
  @ApiResponse({ status: 200, type: isBoolean })
  @UsePipes(new ValidationPipe())
  async checkEmail(@Body() data: CheckEmailReqDto) {
    return await this.authService.checkEmail(data);
  }

  @Post('verify')
  @ApiOperation({
    summary: '회원가입을 위한 이메일 인증 요청',
    description: '다시 한번 이메일 중복 체크 후 인증 링크 발송',
  })
  @ApiBody({ type: CreateUserReqDto })
  @ApiResponse({ status: 201 })
  @UsePipes(new ValidationPipe())
  async verify(@Body() createUserDto: CreateUserReqDto) {
    await this.authService.isEmailOwned(createUserDto);

    return;
  }

  @Get('register')
  @ApiOperation({
    summary: '인증 링크 확인 후 회원 등록 및 리다이렉트',
  })
  @ApiResponse({ status: 201, type: UserResDto })
  async register(
    @Query('token') token: string,
    @Req() req: ExpressRequest,
    @Res() res: Response,
  ): Promise<UserResDto> {
    const user = await this.authService.register(token);
    req.user = user;
    res.redirect(''); // todo 리다이렉트 주소 추가

    return user;
  }

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiBody({ type: LoginReqDto })
  @ApiResponse({ status: 200 })
  @UsePipes(new ValidationPipe())
  @UseGuards(AuthGuard('local'))
  async login() {
    return;
  }

  @Post('google')
  @ApiOperation({
    summary: 'OAuth-구글 로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect() {
    return;
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
