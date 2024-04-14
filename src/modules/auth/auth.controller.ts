import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { UserResDto } from './dto/userRes.dto';
import { LoginReqDto } from './dto/loginReq.dto';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { isBoolean } from 'class-validator';
import { CheckEmailReqDto } from './dto/checkEamilReq.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '이메일중복검사',
  })
  @Get('check-email')
  @ApiBody({ type: CheckEmailReqDto })
  @ApiResponse({ status: 200, type: isBoolean })
  @UsePipes(new ValidationPipe())
  async checkEmail(@Body() data: CheckEmailReqDto) {
    return await this.authService.checkEmail(data);
  }

  @ApiOperation({
    summary: '회원가입',
    description: '회원 가입 후 응답 헤더에 JWT 추가',
  })
  @Post('register')
  @ApiBody({ type: CreateUserReqDto })
  @ApiResponse({ status: 201, type: UserResDto })
  @UsePipes(new ValidationPipe())
  async register(
    @Body() createUserDto: CreateUserReqDto,
    @Req() req: ExpressRequest,
  ): Promise<UserResDto> {
    const user = await this.authService.register(createUserDto);
    req.user = user;

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
