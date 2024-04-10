import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
  HttpStatus,
  Res,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { generateJWT } from '../../common/utils/jwt.utils';
import { UserResDto } from './dto/userRes.dto';
import { LoginReqDto } from './dto/loginReq.dto';
import { CreateUserReqDto } from './dto/createUserReq.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '회원가입',
    description: '회원 가입 후 응답 헤더에 JWT 추가',
  })
  @Post('register')
  @ApiBody({ type: CreateUserReqDto })
  @ApiResponse({ status: 201, type: UserResDto })
  @UsePipes(new ValidationPipe())
  async register(@Body() createUserDto: CreateUserReqDto, @Res() res: Response): Promise<void> {
    const user = await this.authService.register(createUserDto);
    const jwt = generateJWT(user.id, user.email);

    res.setHeader('Authorization', `Bearer ${jwt}`);
    res.status(HttpStatus.CREATED).send();
    return;
  }

  @Get('login')
  @ApiOperation({
    summary: '로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiBody({ type: LoginReqDto })
  @ApiResponse({ status: 200 })
  @UsePipes(new ValidationPipe())
  @UseGuards(AuthGuard('local'))
  async login(@Request() req: ExpressRequest, @Res() res: Response): Promise<void> {
    const jwt = generateJWT(req.user.id, req.user.email);

    res.setHeader('Authorization', `Bearer ${jwt}`);
    res.status(HttpStatus.OK).send();
    return;
  }

  @Get('google')
  @ApiOperation({
    summary: 'OAuth-구글 로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req: ExpressRequest, @Res() res: Response) {
    const jwt = await this.authService.oauthLogin(req.user);

    res.setHeader('Authorization', `Bearer ${jwt}`);
    res.status(HttpStatus.OK).send();
  }

  @Get('kakao')
  @ApiOperation({
    summary: 'OAuth-카카오 로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async kakaoAuthRedirect(@Request() req: ExpressRequest, @Res() res: Response) {
    const jwt = await this.authService.oauthLogin(req.user);

    res.setHeader('Authorization', `Bearer ${jwt}`);
    res.status(HttpStatus.OK).send();
  }

  @Get('naver')
  @ApiOperation({
    summary: 'OAuth-네이버 로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(AuthGuard('google'))
  async naverAuthRedirect(@Request() req: ExpressRequest, @Res() res: Response) {
    const jwt = await this.authService.oauthLogin(req.user);

    res.setHeader('Authorization', `Bearer ${jwt}`);
    res.status(HttpStatus.OK).send();
  }
}
